// @flow
import React from 'react';
import { connect } from 'react-redux';

import { logoutUser } from '../actions/UserLogout';
import Navs from '../components/Header';

type Props = {
  isAuthenticated: boolean,
  dispatch: Function
};

function Header(props: Props) {
  const { dispatch, isAuthenticated } = props;

  return (
    <Navs
      isAuthenticated={isAuthenticated}
      dispatch={dispatch}
      logoutUser={logoutUser}
    />
  );
}

function mapStateToProps(state) {
  const { userAuth } = state;
  const { isAuthenticated } = userAuth;

  return { isAuthenticated };
}

export default connect(mapStateToProps)(Header);
