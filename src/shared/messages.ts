export type PopupToBackgroundMessage = { type: "GET_STATE" };

export type BackgroundToPopupMessage = {
  type: "STATE_UPDATED";
  state: {
    status: "idle";
  };
};
