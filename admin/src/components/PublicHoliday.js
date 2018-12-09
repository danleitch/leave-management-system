// @flow
import React, { useState } from 'react';
import gql from 'graphql-tag';
import { Query, Mutation } from 'react-apollo';

import 'react-dates/initialize';
import 'react-dates/lib/css/_datepicker.css';
import { DayPickerSingleDateController } from 'react-dates';

const moment = require('moment');

const PUBLIC_HOLIDAY = gql`
  {
    publicHoliday {
      edges {
        node {
          id
          holidayDate
        }
      }
    }
  }
`;

const ADD_PUBLIC_HOLIDAY = gql`
  mutation addPublicholiday($holidayDate: String!) {
    addPublicholiday(holidayDate: $holidayDate) {
      publicHoliday {
        id
        holidayDate
      }
    }
  }
`;

const DELETE_PUBLIC_HOLIDAY = gql`
  mutation deletePublicholiday($id: String!) {
    deletePublicholiday(id: $id) {
      ok
    }
  }
`;

type addHolidayProps = {
  holidayDate: any
};

function AddHoliday(props: addHolidayProps) {
  return (
    <Mutation
      mutation={ADD_PUBLIC_HOLIDAY}
      variables={{ holidayDate: props.holidayDate }}
      refetchQueries={[{ query: PUBLIC_HOLIDAY }]}
    >
      {(addPublicHoliday, { loading, error, refetch }) => {
        if (loading) {
          return <p className="font-italic text-primary mt-4">Loading...</p>;
        }

        if (error) {
          console.log(error);
          return (
            <>
              <p className="font-italic text-danger mt-4">{error.message}</p>
              <button
                onClick={addPublicHoliday}
                className="btn btn-primary mt-2"
              >
                Add
              </button>
            </>
          );
        }

        return (
          <button onClick={addPublicHoliday} className="btn btn-primary mt-4">
            Add
          </button>
        );
      }}
    </Mutation>
  );
}

type addPublicHolidayProps = {
  render: any
};

// type addPublicHolidayState = {
//   date: any,
//   focused: any,
// };

function AddPublicHoliday(props: addPublicHolidayProps) {
  const [date, setDate] = useState(null);
  const [focused, setFocused] = useState(false);

  function onDateChange(e: Event) {
    setDate(e);
  }

  function onFocusChange(e: Event & { focused: HTMLElement }) {
    setFocused(e.focused);
  }

  return (
    <>
      <DayPickerSingleDateController
        onDateChange={onDateChange}
        onFocusChange={onFocusChange}
        focused={focused}
        date={date}
        hideKeyboardShortcutsPanel
      />
      {props.render(date)}
    </>
  );
}

type deleteHolidayProps = {
  id: string
};

function DeleteHoliday(props: deleteHolidayProps) {
  return (
    <Mutation
      mutation={DELETE_PUBLIC_HOLIDAY}
      variables={{ id: props.id }}
      refetchQueries={[{ query: PUBLIC_HOLIDAY }]}
    >
      {(deletePublicHoliday, { loading, error }) => {
        if (loading) {
          return (
            <span className="ml-2 font-italic text-primary">Loading...</span>
          );
        }

        if (error) {
          console.log(error);
          return (
            <span className="ml-2 font-italic text-warning">Error...</span>
          );
        }

        return (
          <button
            className="btn btn-link btn-sm text-danger"
            onClick={deletePublicHoliday}
          >
            Delete
          </button>
        );
      }}
    </Mutation>
  );
}

type PublicHolidayProps = {
  render: any
};

function PublicHolidays(props: PublicHolidayProps) {
  return (
    <Query query={PUBLIC_HOLIDAY}>
      {({ loading, error, data }) => {
        if (loading) {
          return (
            <div
              className="container text-center"
              style={{ paddingTop: '100px' }}
            >
              <div className="col-md-8 ml-auto mr-auto">
                <div className="loader1" />
              </div>
            </div>
          );
        }

        if (error) {
          console.log(error.message);
          return (
            <div
              className="container text-center"
              style={{ paddingTop: '100px' }}
            >
              <div className="col-md-8 ml-auto mr-auto">
                <p>Something went wrong!</p>
              </div>
            </div>
          );
        }

        let list = data.publicHoliday.edges
          .map(a => a.node)
          .sort((b, c) => {
            return new Date(c.holidayDate) - new Date(b.holidayDate);
          });

        const public_holidays = list.map(item => {
          let hDate = new Date(item.holidayDate);
          let holiday_date = moment(hDate).format('dddd, Do MMMM YYYY');

          return (
            <li key={item.id}>
              {holiday_date}
              {props.render(item.id)}
            </li>
          );
        });

        return (
          <div className="DeletePublicHolidays">
            <ul>{public_holidays}</ul>
          </div>
        );
      }}
    </Query>
  );
}

export default function() {
  return (
    <div className="card">
      <div className="card-header">
        <h4>Public Holidays</h4>
      </div>
      <div className=" card-body">
        <div className="row">
          <div className="col">
            <PublicHolidays
              render={function(id) {
                return <DeleteHoliday id={id} />;
              }}
            />
          </div>
          <div className="col">
            <AddPublicHoliday
              render={function(date) {
                return <AddHoliday holidayDate={date} />;
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
