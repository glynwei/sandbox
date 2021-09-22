drop table if exists session;

----
create table session(
  device_id string
  ,session_id string
  ,start_time timestamp
  ,last_modified_time timestamp
  ,ip_address string
  ,user_agent string
  ,client_type string
  ,entry_url string
  ,variants array<string>
)
comment 'table generated to represent Causal session'
PARTITIONED BY ( 
  ds string, 
  hh string)
ROW FORMAT SERDE 
  'org.apache.hadoop.hive.ql.io.orc.OrcSerde' 
WITH SERDEPROPERTIES ( 
  'orc.column.index.access'='false')
STORED AS INPUTFORMAT 
  'org.apache.hadoop.hive.ql.io.orc.OrcInputFormat' 
OUTPUTFORMAT 
  'org.apache.hadoop.hive.ql.io.orc.OrcOutputFormat'
LOCATION
  's3://causal-getting-started-1/prerelease/tables/session/';



----
drop table if exists rating_box;
----
create table rating_box(
  session_id string
  ,impression_ids array<string>
  ,first_time timestamp
  ,impression_count bigint
  ,product string comment 'The product that we are collecting ratings for'
  ,call_to_action string comment 'The text next to the stars that prompts the visitor to rate the product'
  ,rating array<struct<event_time:timestamp,impression_id:string,stars:bigint>>
)
comment 'impression table for the Causal RatingBox feature'
PARTITIONED BY ( 
  ds string, 
  hh string)
ROW FORMAT SERDE 
  'org.apache.hadoop.hive.ql.io.orc.OrcSerde' 
WITH SERDEPROPERTIES ( 
  'orc.column.index.access'='false') 
STORED AS INPUTFORMAT 
  'org.apache.hadoop.hive.ql.io.orc.OrcInputFormat' 
OUTPUTFORMAT 
  'org.apache.hadoop.hive.ql.io.orc.OrcOutputFormat'
LOCATION
  's3://causal-getting-started-1/prerelease/tables/rating_box/';

----
drop table if exists product_info;
----
create table product_info(
  session_id string
  ,impression_ids array<string>
  ,first_time timestamp
  ,impression_count bigint
)
comment 'impression table for the Causal ProductInfo feature'
PARTITIONED BY ( 
  ds string, 
  hh string)
ROW FORMAT SERDE 
  'org.apache.hadoop.hive.ql.io.orc.OrcSerde' 
WITH SERDEPROPERTIES ( 
  'orc.column.index.access'='false') 
STORED AS INPUTFORMAT 
  'org.apache.hadoop.hive.ql.io.orc.OrcInputFormat' 
OUTPUTFORMAT 
  'org.apache.hadoop.hive.ql.io.orc.OrcOutputFormat'
LOCATION
  's3://causal-getting-started-1/prerelease/tables/product_info/';

----
drop table if exists feature2;
----
create table feature2(
  session_id string
  ,impression_ids array<string>
  ,first_time timestamp
  ,impression_count bigint
  ,example_arg string comment 'Example args'
  ,example_output string comment 'Example output'
  ,example_event array<struct<event_time:timestamp,impression_id:string,data:string>>
)
comment 'impression table for the Causal Feature2 feature'
PARTITIONED BY ( 
  ds string, 
  hh string)
ROW FORMAT SERDE 
  'org.apache.hadoop.hive.ql.io.orc.OrcSerde' 
WITH SERDEPROPERTIES ( 
  'orc.column.index.access'='false') 
STORED AS INPUTFORMAT 
  'org.apache.hadoop.hive.ql.io.orc.OrcInputFormat' 
OUTPUTFORMAT 
  'org.apache.hadoop.hive.ql.io.orc.OrcOutputFormat'
LOCATION
  's3://causal-getting-started-1/prerelease/tables/feature2/';




