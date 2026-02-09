export const cartContext = async (req, res, next) => {
  try {
    console.log("req.User=====>", req.auth);

    if (req.auth) {
      req.cartOwner = {
        type: "user",
        id: req?.auth?.id,
      };
      return next();
    }

    let guestSessionId = req.cookies?.guest_cart_session;

    if (guestSessionId) {
      req.cartOwner = {
        type: "guest",
        id: guestSessionId,
      };
      return next();
    }

    req.cartOwner = null;
    next();
  } catch (error) {
    req.cartOwner = null;
    next();
  }
};
