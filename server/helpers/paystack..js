// // helpers/paystack.js
// const axios = require("axios");

// const Paystack = {
//   verifyTransaction: async (reference) => {
//     try {
//       const options = {
//         method: "GET",
//         url: `https://api.paystack.co/transaction/verify/${reference}`,
//         headers: {
//           Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
//         },
//       };
//       const response = await axios(options);
//       return response.data;
//     } catch (error) {
//       throw new Error("Transaction verification failed");
//     }
//   },
// };

// module.exports = Paystack;
