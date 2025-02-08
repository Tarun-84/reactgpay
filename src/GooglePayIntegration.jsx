import React from "react";

const GooglePayIntegration = () => {
  return (
    <div>
      <button onClick={onBuyClicked}>Click Meee</button>
    </div>
  );
};

const canMakePaymentCache = "canMakePaymentCache";

function checkCanMakePayment(request) {
  if (sessionStorage.hasOwnProperty(canMakePaymentCache)) {
    return Promise.resolve(JSON.parse(sessionStorage[canMakePaymentCache]));
  }

  let canMakePaymentPromise = Promise.resolve(true);

  if (request.canMakePayment) {
    canMakePaymentPromise = request.canMakePayment();
  }

  return canMakePaymentPromise
    .then((result) => {
      sessionStorage[canMakePaymentCache] = result;
      return result;
    })
    .catch((err) => {
      console.log("Error calling canMakePayment: " + err);
    });
}

function onBuyClicked() {
  if (!window.PaymentRequest) {
    console.log("Web payments are not supported in this browser.");
    return;
  }

  const supportedInstruments = [
    {
        supportedMethods: ["https://tez.google.com/pay"],
        data: {
          pa: "dipeshsharma938@ibl", // Verify this UPI ID
          pn: "Koncept Software Solutions",
          tr: "1234ABCD", 
          url: "https://reactgpay.vercel.app/",
          mc: "5045", // Change this to "0000" for testing
          tn: "Purchase in Merchant",
        },
    },
  ];

  const details = {
    total: {
      label: "Total",
      amount: {
        currency: "INR",
        value: "1.01",
      },
    },
    displayItems: [
      {
        label: "Original Amount",
        amount: {
          currency: "INR",
          value: "1.01",
        },
      },
    ],
  };

  let request = null;
  try {
    request = new PaymentRequest(supportedInstruments, details);
  } catch (e) {
    console.log("Payment Request Error: " + e.message);
    return;
  }

  if (!request) {
    console.log("Web payments are not supported in this browser.");
    return;
  }

  checkCanMakePayment(request)
    .then((result) => {
      showPaymentUI(request, result);
    })
    .catch((err) => {
      console.log("Error calling checkCanMakePayment: " + err);
    });
}

function showPaymentUI(request, canMakePayment) {
  if (!canMakePayment) {
    alert("Google Pay is not ready to pay.");
    return;
  }

  let paymentTimeout = window.setTimeout(() => {
    window.clearTimeout(paymentTimeout);
    request.abort()
      .then(() => console.log("Payment timed out after 20 minutes."))
      .catch(() => console.log("Unable to abort, user is in the process of paying."));
  }, 20 * 60 * 1000);

  request.show()
    .then((instrument) => {
      window.clearTimeout(paymentTimeout);
      processResponse(instrument);
    })
    .catch((err) => console.log(err));
}

function processResponse(instrument) {
  const instrumentString = JSON.stringify({
    methodName: instrument.methodName,
    details: instrument.details,
    payerName: "Dipesh",
    payerPhone: "9818525179",
    payerEmail: "support@konceptsoftwaresolutions.com",
  }, undefined, 2);

  console.log(instrumentString);

  fetch("https://renepho.konceptsoftwaresolutions.com/api/renepho/user/post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: instrumentString,
  })
    .then((buyResult) => buyResult.ok ? buyResult.json() : console.log("Error sending instrument to server."))
    .then((buyResultJson) => completePayment(instrument, buyResultJson.status, buyResultJson.message))
    .catch((err) => console.log("Unable to process payment. " + err));
}

function completePayment(instrument, result, msg) {
  instrument.complete(result)
    .then(() => {
      console.log("Payment succeeds.");
      console.log(msg);
    })
    .catch((err) => console.log(err));
}

export default GooglePayIntegration;
