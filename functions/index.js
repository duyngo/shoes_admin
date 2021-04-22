const functions = require("firebase-functions");
const admin = require("firebase-admin");
const algoliasearch = require("algoliasearch");
const nodemailer = require("nodemailer");

admin.initializeApp(functions.config().firebase);

const client = algoliasearch(
  functions.config().algoliadev.id,
  functions.config().algoliadev.adminapikey,
  {
    timeouts: {
      connect: 1000,
      read: 2 * 1000,
      write: 30 * 1000,
    },
  }
);

const ordersIndex = client.initIndex("dev_ORDERS");
const promosIndex = client.initIndex("dev_PROMO_CODES");
const usersIndex = client.initIndex("dev_USERS");

const orderRef = admin.firestore().collection("orders");
const userRef = admin.firestore().collection("users");
const promotionRef = admin.firestore().collection("promotionCodes");

const notificationOptions = {
  priority: "high",
  timeToLive: 60 * 60 * 24,
};

const createNotification = (notification) => {
  let doc = admin
    .firestore()
    .collection("notifications")
    .doc();

  notification.uid = doc.id;
  notification.isRemoved = false;
  doc.set(notification).then(() => {
    console.log("notification added");
    return doc.id;
  });
};

const updateOrderTimeline = (prevVal, newVal) => {
  let oRef = orderRef.doc(`${newVal.uid}`);

  admin.firestore().runTransaction((t) => {
    return t.get(oRef).then((doc) => {
      let newTimelineObj = doc.data().timeline;
      newTimelineObj.push({
        from: prevVal.status,
        to: newVal.status,
        timestamp: admin.firestore.Timestamp.now(),
      });
      t.update(oRef, { timeline: [...newTimelineObj] });

      return true;
    });
  });
};

exports.orderCreated = functions.firestore
  .document("orders/{uid}")
  .onCreate(async (snap, context) => {
    let newValue = snap.data();

    newValue.objectID = newValue.uid;

    await ordersIndex.addObject(newValue);

    const address = newValue.addressText;

    const customers = await userRef
      .where("uid", "==", newValue.customerUid)
      .get();

    let userToken = [];
    for (var c of customers.docs) {
      if (
        c.data().fcmToken !== "" &&
        c.data().fcmToken !== null &&
        c.data().fcmToken !== undefined
      ) {
        let customerNotifObj = {
          recipient: newValue.customerUid,
          title: `New pickup request`,
          body: `Thanks for your order, our admin will be in touch shortly to pick up your items`,
          dateSent: admin.firestore.FieldValue.serverTimestamp(),
          data: {
            orderUid: newValue.uid,
          },
          type: "orderCreated",
          isRemoved: false,
        };

        userToken.push(c.data().fcmToken);
        await createNotification(customerNotifObj);
      }
    }

    if (userToken.length !== 0) {
      const customerPayload = {
        notification: {
          title: `New pickup request`,
          body: `Thanks for your order, our admin will be in touch shortly to pick up your items`,
        },
      };

      admin
        .messaging()
        .sendToDevice(userToken, customerPayload, notificationOptions)
        .then((response) => {
          console.info("[SUCCESS]", response);
        })
        .catch((error) => {
          console.info("[ERROR]", error.message);
        });
    }

    const users = await userRef.where("type", "==", "courier").get();

    let userTokens = [];
    for (var u of users.docs) {
      if (
        u.data().fcmToken !== "" &&
        u.data().fcmToken !== null &&
        u.data().fcmToken !== undefined
      ) {
        let notifObj = {
          recipient: u.data().uid,
          title: `New pickup request`,
          body: `A new order is ready for pickup at ${address}`,
          dateSent: admin.firestore.FieldValue.serverTimestamp(),
          data: {
            orderUid: newValue.uid,
          },
          type: "newPickupRequest",
          isRemoved: false,
        };
        userTokens.push(u.data().fcmToken);
        await createNotification(notifObj);
      }
    }

    const payload = {
      notification: {
        title: "New pickup request",
        body: `A new order is ready for pickup at ${address}`,
      },
    };

    return admin
      .messaging()
      .sendToDevice(userTokens, payload, notificationOptions)
      .then((response) => {
        console.info("[SUCCESS]", response);
        return response;
      })
      .catch((error) => {
        console.info("[ERROR]", error.message);
        return error;
      });
  });

exports.orderStatusUpdated = functions.firestore
  .document("orders/{uid}")
  .onUpdate(async (change, context) => {
    const newValue = change.after.data();
    const prevValue = change.before.data();

    await ordersIndex.saveObject({
      ...newValue,
      objectID: newValue.uid,
    });

    if (newValue.status != prevValue.status) {
      let notifObj = {};
      let courNotifObj = {};
      let services = [];

      for (var item of newValue.items) {
        services.push(item.serviceType);
      }

      const user = await userRef.where("uid", "==", newValue.customerUid).get();
      let userToken = "";

      if (user.size > 0)
        user.docs.forEach((doc) => {
          userToken = doc.data().fcmToken;
        });
      else userToken = userToken;

      if (
        prevValue.status == "waitingForPickup" &&
        newValue.status == "onTheWay"
      ) {
        notifObj = {
          recipient: prevValue.customerUid,
          title: `Update for ${services.join(",")}`,
          body: `Thanks for your order, our admin will be in touch shortly to pick up your items`,
          dateSent: admin.firestore.FieldValue.serverTimestamp(),
          data: {
            orderUid: newValue.uid,
          },
          type: "orderStatusUpdate",
          isRemoved: false,
        };
      }

      if (
        prevValue.status == "onTheWay" &&
        newValue.status == "paidAndOnProgress"
      ) {
        notifObj = {
          recipient: prevValue.customerUid,
          title: `Update for ${services.join(",")}`,
          body: `Your items are now ready to be washed.`,
          dateSent: admin.firestore.FieldValue.serverTimestamp(),
          data: {
            orderUid: newValue.uid,
          },
          type: "orderStatusUpdate",
          isRemoved: false,
        };
      }

      if (
        prevValue.status == "paidAndOnProgress" &&
        newValue.status == "done"
      ) {
        notifObj = {
          recipient: prevValue.customerUid,
          title: `Update for ${services.join(",")}`,
          body: `Your items are ready to be delivered! We are delivering them to you, please make sure someone at home.`,
          dateSent: admin.firestore.FieldValue.serverTimestamp(),
          data: {
            orderUid: newValue.uid,
          },
          type: "orderStatusUpdate",
          isRemoved: false,
        };

        const user = await userRef
          .where("uid", "==", newValue.courierUid)
          .get();

        let userToken = [];
        for (var u of user.docs) {
          if (
            u.data().fcmToken !== "" &&
            u.data().fcmToken !== null &&
            u.data().fcmToken !== undefined
          )
            userToken.push(u.data().fcmToken);
        }

        const courPayload = {
          notification: {
            title: `Done cleaning ${services.join(",")}`,
            body: `The items are ready for delivery`,
          },
        };

        courNotifObj = {
          recipient: prevValue.courierUid,
          title: `Done cleaning ${services.join(",")}`,
          body: `The items are ready for delivery`,
          dateSent: admin.firestore.FieldValue.serverTimestamp(),
          data: {
            orderUid: newValue.uid,
          },
          type: "courierOrderStatusUpdate",
          isRemoved: false,
        };

        // Notify courier
        await createNotification(courNotifObj);
        await admin
          .messaging()
          .sendToDevice(userToken, courPayload, notificationOptions)
          .then((response) => {
            console.info("[SUCCESS]", response);
          })
          .catch((error) => {
            console.info("[ERROR]", error.message);
          });
      }

      if (prevValue.status == "done" && newValue.status == "delivered") {
        notifObj = {
          recipient: prevValue.customerUid,
          title: `Update for ${services.join(",")}`,
          body: `Your items has been delivered! Thank you and please order again!`,
          dateSent: admin.firestore.FieldValue.serverTimestamp(),
          data: {
            orderUid: newValue.uid,
          },
          type: "orderStatusUpdate",
          isRemoved: false,
        };
      }

      await updateOrderTimeline(prevValue, newValue);
      // Notify user
      await createNotification(notifObj);

      const payload = {
        notification: {
          title: notifObj.title,
          body: notifObj.body,
        },
      };

      await admin
        .messaging()
        .sendToDevice(userToken, payload, notificationOptions)
        .then((response) => {
          console.info("[SUCCESS]", response);
        })
        .catch((error) => {
          console.info("[ERROR]", error.message);
        });

      return true;
    }
  });

/**
 * PROMO FUNCTIONS
 */

exports.promoCreated = functions.firestore
  .document("promotionCodes/{uid}")
  .onCreate(async (snap, context) => {
    let newValue = snap.data();

    newValue.objectID = newValue.uid;

    await promosIndex.addObject(newValue);
  });

exports.promotionCodeUpdated = functions.firestore
  .document("promotionCodes/{uid}")
  .onUpdate(async (change, context) => {
    const newValue = change.after.data();

    await promosIndex.saveObject({
      ...newValue,
      objectID: newValue.uid,
    });
  });

exports.notifyPromoUsers = functions.https.onCall(async (data, context) => {
  let userTokens = [];
  for (var u of data.users) {
    userTokens.push(u.fcmToken);
  }

  const payload = {
    notification: {
      title: data.notification.title,
      body: data.notification.body,
    },
  };

  console.log("[NOTIFY PROMO USERS]" + userTokens);

  if (userTokens.length !== 0) {
    return admin
      .messaging()
      .sendToDevice(userTokens, payload, notificationOptions)
      .then((response) => {
        console.info("[SUCCESS]", response);
        return response;
      })
      .catch((error) => {
        console.info("[ERROR]", error.message);
        return error;
      });
  }
});

/**
 * END
 */

/**
 * USER FUNCTIONS
 */

exports.userCreated = functions.firestore
  .document("users/{uid}")
  .onCreate(async (snap, context) => {
    let newValue = snap.data();

    newValue.objectID = newValue.uid;

    await usersIndex.addObject(newValue);
  });

exports.updateUserProfile = functions.https.onCall(async (data, context) => {
  return new Promise((resolve, reject) => {
    admin
      .auth()
      .updateUser(data.uid, {
        email: data.email,
      })
      .then(async function(userRecord) {
        await usersIndex.saveObject({
          ...data,
          objectID: data.uid,
        });

        console.info("[SUCCESS] User updated.");
        resolve(true);
      })
      .catch(function(error) {
        console.info("[ERROR]", error);
        reject(false);
      });
  });
});

exports.disableUser = functions.https.onCall(async (data, context) => {
  return new Promise((resolve, reject) => {
    admin
      .auth()
      .updateUser(data.uid, {
        disabled: true,
      })
      .then(async function(userRecord) {
        await usersIndex.saveObject({
          ...data,
          objectID: data.uid,
        });

        console.info("[SUCCESS] User disabled.");
        resolve(true);
      })
      .catch(function(error) {
        console.info("[ERROR]", error);
        reject(false);
      });
  });
});

exports.banUser = functions.https.onCall(async (data, context) => {
  const { uid } = data;
  return new Promise((resolve, reject) => {
    admin
      .auth()
      .updateUser(uid, {
        disabled: true,
      })
      .then(async function(userRecord) {
        await usersIndex.saveObject({
          ...data,
          objectID: data.uid,
        });

        console.info("[SUCCESS] User banned.");
        resolve(true);
      })
      .catch(function(error) {
        console.info("[ERROR]", error.message);
        reject(false);
      });
  });
});

exports.notifyBannedUser = functions.https.onCall(async (data, context) => {
  return new Promise((resolve, reject) => {
    const { userToken, uid } = data;

    const payload = {
      notification: {
        title: data.title,
        body: data.body,
      },
    };

    return admin
      .messaging()
      .sendToDevice(userToken, payload, notificationOptions)
      .then((response) => {
        console.info("[SUCCESS]", response);

        admin
          .auth()
          .revokeRefreshTokens(uid)
          .then(() => {
            return admin.auth().getUser(uid);
          })
          .then((userRecord) => {
            return new Date(userRecord.tokensValidAfterTime).getTime() / 1000;
          })
          .then((timestamp) => {
            resolve(true);
            console.log("[SUCCESS] Tokens revoked at: ", timestamp);
          });
      })
      .catch((error) => {
        console.info("[ERROR]", error.message);
        reject(false);
      });
  });
});

exports.emailBannedUser = functions.https.onCall(async (data, context) => {
  return new Promise((resolve, reject) => {
    const gmailPassword = functions.config().gmail.password;
    const gmailEmail = functions.config().gmail.email;

    var transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      auth: {
        user: gmailEmail,
        pass: gmailPassword,
      },
    });

    const { userEmail, subject, body } = data;

    const mailOptions = {
      to: userEmail,
      from: `<noreply@${data.authDomain}`,
      subject: subject,
      text: body,
      html: body,
    };

    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.info("[ERROR]", error.message);
        reject(false);
      } else {
        console.info(mailOptions);
        console.info("[SUCCESS] Mail sent to banned user.");
        resolve(true);
      }
    });
  });
});

exports.sendAdminInvite = functions.https.onCall(async (data, context) => {
  return new Promise((resolve, reject) => {
    const gmailPassword = functions.config().gmail.password;
    const gmailEmail = functions.config().gmail.email;

    var transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      auth: {
        user: gmailEmail,
        pass: gmailPassword,
      },
    });

    const { subject, body, userEmail } = data;

    const mailOptions = {
      to: userEmail,
      from: `<noreply@${data.authDomain}`,
      subject: subject,
      text: body,
      html: body,
    };

    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.info("[ERROR]", error.message);
        reject(false);
      } else {
        console.info("[SUCCESS] Mail sent to user.");
        resolve(true);
      }
    });
  });
});
