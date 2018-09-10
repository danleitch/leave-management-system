// @flow
import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { gql } from 'apollo-boost';
import { graphql, compose } from 'react-apollo';

import {
  requestUserLoginFromToken,
  receiveUserLoginFromToken,
  loginUserErrorFromToken
} from '../actions/UserLogin';
import {
  fetchLeaveApplication,
  clearLeaveApplicationMessage
} from '../actions/LeaveApplication';
import Application from '../components/LeaveApplication';

const VERIFY_USER_TOKEN = gql`
  mutation verifyUserToken($userToken: String!) {
    verifyUserToken(userToken: $userToken) {
      token
      ok
    }
  }
`;

type Props = {
  auth_info: Object,
  dispatch: Function,
  isAuthenticated: boolean,
  message: string,
  verifyUserToken: Function
};

class LeaveApplication extends Component<Props> {
  verifyToken: Function;

  constructor() {
    super();
    this.verifyToken = this.verifyToken.bind(this);
  }

  componentDidMount() {
    this.verifyToken();
    setInterval(this.verifyToken, 600000);
  }

  componentWillUnmount() {
    this.props.dispatch(clearLeaveApplicationMessage());
  }

  async verifyToken() {
    const { auth_info, dispatch, verifyUserToken } = this.props;

    const userToken = auth_info.auth_token
      ? auth_info.auth_token
      : localStorage.getItem('auth_token');

    if (userToken) {
      try {
        dispatch(requestUserLoginFromToken());
        const response = await verifyUserToken({
          variables: { userToken }
        });
        const auth_info = {
          auth_token: response.data.verifyUserToken.token
        };
        dispatch(receiveUserLoginFromToken(auth_info));
      } catch (error) {
        console.log(error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('id');
        dispatch(loginUserErrorFromToken('Your session has expired!'));
      }
    }
  }

  render() {
    const { dispatch, isAuthenticated, auth_info, message } = this.props;
    let id = auth_info.id ? auth_info.id : localStorage.getItem('id');

    return (
      <Fragment>
        {isAuthenticated ? (
          <Application
            id={id}
            message={message}
            dispatch={dispatch}
            onLeaveApplicationClick={function(applicationDetails) {
              return dispatch(fetchLeaveApplication(applicationDetails));
            }}
          />
        ) : (
          <Redirect to="/" />
        )}
      </Fragment>
    );
  }
}

function mapStateToProps(state) {
  const { userAuth, leaveApplication } = state;
  const { auth_info, isAuthenticated } = userAuth;
  const { message } = leaveApplication;

  return {
    auth_info,
    isAuthenticated,
    message
  };
}

export default compose(
  connect(mapStateToProps),
  graphql(VERIFY_USER_TOKEN, { name: 'verifyUserToken' })
)(LeaveApplication);
