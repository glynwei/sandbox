package io.causallabs.example;

import io.causallabs.runtime.CausalClient;

class Test {

    final String impressionId = "impressionId";

    public void main() throws Exception {
        SessionRequest s = SessionRequest.builder()
                .visitorId("testVisitorId")
                .arrivalId("testArrivalId")
                .userId(null)
                .build();
        SimpleRequest req = SimpleRequest.builder().simpleInput(123).build();
        CausalClient.getInstance().request(s, "impressionId", req);
        if (!req.isSimpleOutputSet()) {
            switch (req.getSimpleOutputExternal()) {
                case BigNumber:
                    req.setSimpleOutput(1000000);
                    break;
                case SmallNumber:
                    req.setSimpleOutput(2);
                    break;
            }
        }
        req.getSimpleOutput();
        req.signalClick(10);
        s.setUserId("loginId");
        s = SessionRequest.builder().visitorId("testVisitorId").arrivalId("testArrivalId")
                .userId("loginId").build();
    }

    public void remoteClickExample() {
        SessionRequest s = SessionRequest.fromArrivalId("testArrivalId");
        SimpleRequest.signalClick(s, impressionId, 10);
    }
}
