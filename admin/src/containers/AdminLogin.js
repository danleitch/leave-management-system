// @flow
import React from 'react';
import gql from 'graphql-tag';
import { Query } from 'react-apollo';
import { Redirect } from 'react-router-dom';

import Login from '../components/AdminLogin';

const IS_AUTHENTICATED = gql`
  query isAdminAuthenticated {
    isAuthenticated @client
    sessionError @client
  }
`;

export default function AdminLogin() {
  return (
    <Query query={IS_AUTHENTICATED}>
      {({ data }) => {
        return !data.isAuthenticated ? (
          <Login sessionError={data.sessionError} />
        ) : (
          <Redirect to="/" />
        );
      }}
    </Query>
  );
}
