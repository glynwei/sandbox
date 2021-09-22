package io.causallabs.tests;

import org.testng.Assert;
import org.testng.annotations.*;
import io.causallabs.example.SessionRequest;
import io.causallabs.runtime.CausalClient;

class ExampleTests {
    CausalClient m_client = CausalClient.init("http://localhost:3004/iserver");

    @Test
    public void testRequest() throws Exception {
        SessionRequest session = SessionRequest.builder().visitorId("test_visitor")
                .arrivalId("test_arrival").build();
        m_client.request(session);
        // verify that the plugin ran
        Assert.assertEquals(session.getUserZipCode(), "02445");
    }

}
