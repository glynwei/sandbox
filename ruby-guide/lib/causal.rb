require 'json'
require 'net/http'
require 'securerandom'

module Causal

# A wrapper class that wraps an already generated json string. 
# So to_json just returns the string
class JsonLiteral
    # @param x [String]
    def initialize(x)
        @x = x
    end
    def to_json(*_args)
        return @x
    end
end

# Class to handle boolean json responses
class Boolean
    def from_json json
        json
    end
end

class CausalClient
    class << self
        def init(url: ENV['CAUSAL_ISERVER'])
            @feature_uri = URI(url + "/features") unless url.nil?
            @signal_uri = URI(url + "/signal") unless url.nil?
            @external_uri = URI(url + "/external") unless url.nil?
        end
        # @type [URI]
        attr_reader :feature_uri, :signal_uri, :external_uri
        private :new
    end
end

CausalClient.init



class Session
    class << self
        #! @method create
        #     @param visitor_id [String] 
        #     @param arrival_id [String] 
        #     @param user_id [String, nil] 
        #     @return [Session]
        def create(visitor_id:, arrival_id:, user_id:nil )
            x = new()
            x.instance_exec do
                raise ArgumentError.new("visitor_id cannot be nil.") if visitor_id.nil? 
                @visitor_id = visitor_id
                raise ArgumentError.new("arrival_id cannot be nil.") if arrival_id.nil? 
                @arrival_id = arrival_id
                @user_id = user_id
            end
            return x
        end
        # @param visitor_id [String]
        # @return [Session]
        def from_visitor_id( visitor_id )
            x = new()
            x.instance_exec do
                raise ArgumentError.new("visitor_id cannot be nil.") if visitor_id.nil? 
                @visitor_id = visitor_id
            end
            return x
        end 
        # @param arrival_id [String]
        # @return [Session]
        def from_arrival_id( arrival_id )
            x = new()
            x.instance_exec do
                raise ArgumentError.new("arrival_id cannot be nil.") if arrival_id.nil? 
                @arrival_id = arrival_id
            end
            return x
        end 
        private :new
    end

    def request(*requests, impression_id: SecureRandom.uuid)
        args = {}
        args['visitorId'] = @visitor_id if defined?(@visitor_id)
        args['arrivalId'] = @arrival_id if defined?(@arrival_id)
        args['userId'] = @user_id if defined?(@user_id)

        payload = {
            fetchOptions: [:flags],
            args: args,
            impressionId: impression_id,
            reqs: requests.map { |r| r.instance_exec { request_ } }
        }
        delayed_error = nil
        begin
            resp = Net::HTTP.start(CausalClient.feature_uri.hostname, CausalClient.feature_uri.port) do |http|
                req = Net::HTTP::Post.new(CausalClient.feature_uri)
                req["X-Causal-visitorId"] = @visitor_id if defined?(@visitor_id)
                req["X-Causal-arrivalId"] = @arrival_id if defined?(@arrival_id)
                req['Content-Type'] = 'application/json'
                req.body = payload.to_json
                http.request(req)
            end
            raise StandardError, resp.body if resp.code != "200"

            resp = JSON resp.body

            @flags_ = resp['_flags']
            response_(resp['session'])
            session = self
            requests.zip(resp['impressions'], resp['errors'] || []).each do |request, impression, error|
                request.instance_exec do
                    @_session = session
                    @impression_id = impression_id
                    response_ impression
                    if not error.nil? then
                        error_(StandardError.new(error))
                        delayed_error = error
                    end
                end
            end
        rescue StandardError => e
            requests.each do |req|
                req.instance_exec do
                    error_(e)
                end
            end
            raise e
        end
        if not delayed_error.nil? then
            raise delayed_error
        end
    end

    # @param name [String]
    # @return [Boolean]
    def feature_active?(name)
       @flags_[name]
    end

    # @return [String] 
    attr_reader :visitor_id
    # @return [String] 
    attr_reader :arrival_id
    # @return [String, nil] 
    attr_reader :user_id
    # @return [String] 
    attr_reader :session_id
    # @return [Numeric] 
    attr_reader :start_time
    # @return [String] 
    attr_reader :user_zip_code

    # @!method signal_click 
    #    @param click_value [Numeric] 
    #    @return [void]
    def signal_click( click_value: )
        msg = {event: 'Click', 
                args: { clickValue: click_value } }
        signal_(msg)
    end

    # @param value_ [String, nil]
    # @return [void]
    def user_id=(value_)
        msg = {mutate: 'userId', value: JsonLiteral.new(value_.to_json) }
        signal_(msg)
        @user_id = value_
    end

    private

    # @return [void]
    def signal_(payload, uri: CausalClient.signal_uri)
        ids = {}
        ids['visitorId'] = @visitor_id if defined?(@visitor_id)
        ids['arrivalId'] = @arrival_id if defined?(@arrival_id)
        payload['id'] = ids
        resp = Net::HTTP.start(uri.hostname, uri.port) do |http|
            req = Net::HTTP::Post.new(uri)
            req["X-Causal-visitorId"] = @visitor_id if defined?(@visitor_id)
            req["X-Causal-arrivalId"] = @arrival_id if defined?(@arrival_id)
            req['Content-Type'] = 'application/json'
            req.body = payload.to_json
            http.request(req)
        end
        raise StandardError, resp.body if resp.code != "200"
    end

    def response_(json)
        @user_zip_code = if json.has_key? "userZipCode"
                json['userZipCode']
            else
                ""
            end
        @visitor_id = json['visitorId'] if json.has_key? "visitorId"
        @arrival_id = json['arrivalId'] if json.has_key? "arrivalId"
        @user_id = json['userId'] if json.has_key? "userId"
        @session_id = json['sessionId'] if json.has_key? "sessionId"
        @start_time = json['startTime'] if json.has_key? "startTime"
    end

end

class Simple

    # @!method initialize
    #     @param simple_input [Numeric] 
    def initialize(simple_input: )
        raise ArgumentError.new("simple_input cannot be nil.") if simple_input.nil?
        @simple_input = simple_input
    end

    # @return [Boolean]
    def active?
        return @active_
    end

    # @return [Numeric] 
    attr_reader :simple_input
    # @return [Array<String>] 
    attr_reader :impression_ids
    # @return [Numeric] 
    attr_reader :simple_output
    # @param x [Numeric]
    def simple_output=(x)
        msg = { feature: 'Simple', 
                impressionId: @impression_id, simpleOutput: JsonLiteral.new(x.to_json) }
        @_session.instance_exec do
           signal_(msg, uri:CausalClient.external_uri)
        end
        @simple_output = x
    end
    # @return [Boolean]
    def simple_output_set?
        defined?(@simple_output)
    end
    # @return [String nil]
    def simple_output_external?
        @_external_simple_output
    end
    # @!method Simple.signal_click
    #    @param session [Session]
    #    @param impression_id [String]
    #    @param click_value [Numeric] 
    #    @return [void]
    def self.signal_click( session:, impression_id:, click_value: )
        msg = {event: 'Click', feature: 'Simple', impressionId: impression_id,
           args: { clickValue: click_value } }
        session.instance_exec do
           signal_(msg)
        end
    end
    # @!method signal_click
    #    @param impression_id [String]
    #    @param click_value [Numeric] 
    #    @return [void]
    def signal_click( click_value: )
        Simple.signal_click( session: @_session, impression_id: @impression_id, click_value:click_value )
    end

    # @return [String]
    attr_reader :impression_id
    # @return [Session]
    attr_reader :_session

    private

    # @return [Hash]
    def request_
        {
            name: "Simple",
            args: {
                simpleInput: simple_input
            }
        }
    end

    # @return [void]
    def response_(json)
        if json == "OFF" then
            @active_ = false
        elsif json == "UNKNOWN" then
            ## server doesn't know about this feature yet
            @active_ = true
            @simple_output = 42
        else
            @active_ = true
            if json.has_key? 'simpleOutput'
                @simple_output = json['simpleOutput']
            elsif json.has_key? '_external_simpleOutput'
                @_external_simple_output = json['_external_simpleOutput']
            else
                @simple_output = 42
            end
        end
    end

    # @return [void]
    def error_(error)
        @simple_output = 42
        @error_ = error
    end

end

end
