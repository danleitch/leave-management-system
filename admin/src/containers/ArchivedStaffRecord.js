// @flow
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { gql } from 'apollo-boost';
import { graphql, compose, Query } from 'react-apollo';

import {
  requestAdminLoginFromToken,
  receiveAdminLoginFromToken,
  loginAdminErrorFromToken
} from '../actions/AdminLogin';
import ArchivedStaffRecordList from '../components/ArchivedStaffRecord';

const VERIFY_ADMIN_TOKEN = gql`
  mutation verifyAdminToken($adminToken: String!) {
    verifyAdminToken(adminToken: $adminToken) {
      token
      ok
    }
  }
`;

const ARCHIVED_USERS = gql`
  {
    findUsers(isArchived: "true") {
      id
      dbId
      othernames
      surname
      email
      annual
      sick
      bereavement
      familyCare
      christmas
      dateOfBirth
      maternity
      paternity
      gender
    }
  }
`;

type Props = {
  isAuthenticated: boolean,
  auth_info: Object,
  verifyAdminToken: Function,
  dispatch: Function
};

function ArchivedStaffRecord(props: Props) {
  useEffect(function() {
    verifyToken();
    setInterval(verifyToken, 600000);
  }, []);

  async function verifyToken() {
    const { auth_info, dispatch, verifyAdminToken } = props;

    const adminToken = auth_info.admin_token
      ? auth_info
      : localStorage.getItem('admin_token');

    if (adminToken) {
      try {
        dispatch(requestAdminLoginFromToken());
        const response = await verifyAdminToken({
          variables: { adminToken }
        });
        dispatch(
          receiveAdminLoginFromToken(response.data.verifyAdminToken.token)
        );
      } catch (error) {
        console.log(error);
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        dispatch(loginAdminErrorFromToken('Your session has expired!'));
      }
    }
  }

  const { isAuthenticated, dispatch } = props;

  return (
    <div className="container">
      {isAuthenticated ? (
        <Query query={ARCHIVED_USERS} pollInterval={60000}>
          {({ loading, error, data: { findUsers: staff_record }, refetch }) => {
            if (loading) {
              return (
                <div className="text-center">
                  <div className="loader1" />
                </div>
              );
            }

            if (error) {
              console.log(error);
              return (
                <div className="text-center">
                  <p>Something went wrong!</p>
                </div>
              );
            }

            return (
              <ArchivedStaffRecordList
                archived_staff_record={staff_record}
                refetch={refetch}
                dispatch={dispatch}
              />
            );
          }}
        </Query>
      ) : (
        <Redirect to="/login" />
      )}
    </div>
  );
}

function mapStateToProps(state) {
  const { adminAuth } = state;

  const { auth_info, isAuthenticated } = adminAuth;

  return { auth_info, isAuthenticated };
}

export default compose(
  connect(mapStateToProps),
  graphql(VERIFY_ADMIN_TOKEN, {
    name: 'verifyAdminToken'
  })
)(ArchivedStaffRecord);
