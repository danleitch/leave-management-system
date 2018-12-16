// @flow
import React, { useEffect } from 'react';
import gql from 'graphql-tag';
import { Query, Mutation, ApolloConsumer } from 'react-apollo';
import { Redirect } from 'react-router-dom';

import { TokenSuccess, TokenFailure } from './TokenComponents';
import SickSheetList from '../components/SickSheetRecord';

const IS_AUTHENTICATED = gql`
  query isAdminAuthenticated {
    isAuthenticated @client
    admin_token @client
  }
`;

const VERIFY_ADMIN_TOKEN = gql`
  mutation verifyAdminToken($adminToken: String!) {
    verifyAdminToken(adminToken: $adminToken) {
      Admin {
        othernames
      }
      token
      ok
    }
  }
`;

const SICK_RECORD = gql`
  {
    findSicksheetRecord {
      id
      startDate
      endDate
      leaveDays
      datePosted
      fileName
      user {
        othernames
        surname
      }
    }
  }
`;

type Props = {
  verifyAdminToken: Function
};

function MainView(props: Props) {
  useEffect(function() {
    props.verifyAdminToken();
  }, []);

  return (
    <div className="container">
      <Query query={SICK_RECORD} pollInterval={60000}>
        {({
          loading,
          error,
          data: { findSicksheetRecord: sickSheet_items }
        }) => {
          if (loading) {
            return (
              <div className="text-center" style={{ marginTop: '80px' }}>
                <div className="loader" />
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

          return <SickSheetList sickSheet_items={sickSheet_items} />;
        }}
      </Query>
    </div>
  );
}

export default function SickSheetRecord() {
  return (
    <Query query={IS_AUTHENTICATED}>
      {({ data }) => {
        let adminToken = data.admin_token
          ? data.admin_token
          : localStorage.getItem('admin_token');

        return data.isAuthenticated ? (
          <ApolloConsumer>
            {client => (
              <Mutation
                mutation={VERIFY_ADMIN_TOKEN}
                variables={{ adminToken: adminToken }}
                onCompleted={data => {
                  if (data.verifyAdminToken) {
                    TokenSuccess(data, client);
                  } else {
                    TokenFailure(client);
                  }
                }}
              >
                {verifyAdminToken => {
                  return <MainView verifyAdminToken={verifyAdminToken} />;
                }}
              </Mutation>
            )}
          </ApolloConsumer>
        ) : (
          <Redirect to="/login" />
        );
      }}
    </Query>
  );
}
