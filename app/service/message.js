import moment from 'moment';
import axios from 'axios';

import store from '../store';
import config from '../config';
import httpOptions from '../helper/http';
import {
  messageCollectionLoadSuccessAction,
  messageEditAction,
  messageSendAction,
} from '../actions/message';

const buildInstantMessage = (text, user) => {
  return {
    id: Math.random(),
    timestamp: moment()
      .unix(),
    text,
    user: {
      id: user.id,
    },
  };
};

const formatMessages = (messages) => {
  const state = store.getState().user;
  const myUserId = state.me.id;
  const formatted = [];

  for (let i = 0; i < messages.length; i += 1) {
    const m = messages[i];
    const previous = messages[i - 1];
    const next = messages[i + 1];

    m.classes = '';
    m.isFirst = false;
    m.my = myUserId === messages[i].user.id;

    if (i === 0) {
      m.classes += '__initial';
      m.isFirst = true;
    }

    if (previous) {
      if (previous.user.id !== m.user.id) {
        m.isFirst = true;
        m.classes += '__first';
      }
    }
    if (previous && !next) {
      m.classes += '__last';
    }
    if (next) {
      if (next.user.id !== m.user.id) {
        m.classes += '__last';
      }
    }

    formatted.push(m);
  }

  return formatted;
};

export const sendMessage = () => {
  const state = store.getState();
  const { text } = state.message;
  const userId = state.room.selected.users[0].id;
  const url = `${config.URL_MESSAGE_USER}/${userId}`;

  if (text.trim().length === 0) {
    return;
  }

  axios
    .post(
      url,
      {
        text,
      },
      httpOptions,
    )
    .then(() => {
      const m = buildInstantMessage(text, state.user.me);
      state.message.collection.push(m);

      const formatted = formatMessages(state.message.collection);

      // Dispatch event
      store.dispatch(messageSendAction(formatted));
    });
};

export const loadMessages = (roomId) => {
  const url = `${config.URL_GROUP}${roomId}`;

  axios
    .get(
      url,
      httpOptions,
    )
    .then((response) => {
      const formatted = formatMessages(response.data.messages);

      // Dispatch event
      store.dispatch(messageCollectionLoadSuccessAction(roomId, formatted));
    });
};

export const editText = (value) => {
  const state = store.getState().room;
  const selectedRoom = state.selected;

  // Dispatch event
  store.dispatch(messageEditAction(selectedRoom.id, value));
};
