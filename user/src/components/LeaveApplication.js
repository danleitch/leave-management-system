// @flow
import React, { useState } from 'react';
import gql from 'graphql-tag';
import { Query } from 'react-apollo';

import 'react-dates/initialize';
import 'react-dates/lib/css/_datepicker.css';
import { DateRangePicker } from 'react-dates';

import axios from 'axios';

import '../spinners.css';

import Moment from 'moment';
import { extendMoment } from 'moment-range';
const moment = extendMoment(Moment);

const USER_DETAIL = gql`
  query($id: ID!) {
    user(id: $id) {
      dbId
      othernames
      surname
      annual
      sick
      bereavement
      christmas
      maternity
      familyCare
      paternity
      gender
      designation
      dateOfBirth
    }
  }
`;

const USER_RECORD = gql`
  query($id: ID!) {
    user(id: $id) {
      leaverecord {
        edges {
          node {
            id
            leaveName
            leaveDays
            startDate
            endDate
            leaveReason
            leaveStatus
          }
        }
      }
    }
  }
`;

const PUBLIC_HOLIDAY = gql`
  {
    publicHoliday {
      edges {
        node {
          holidayDate
        }
      }
    }
  }
`;

function UserName(props) {
  return (
    <p>
      {props.user_detail.othernames} {props.user_detail.surname}
    </p>
  );
}

function UserRecord(props) {
  const { user_detail } = props;

  let gender = user_detail.gender ? user_detail.gender.toLowerCase() : null;

  return (
    <ul className="list-group">
      <li className="list-group-item d-flex justify-content-between align-items-center">
        Annual
        <span className="badge badge-primary badge-pill">
          {user_detail.annual}
        </span>
      </li>
      <li className="list-group-item d-flex justify-content-between align-items-center">
        Sick
        <span className="badge badge-primary badge-pill">
          {user_detail.sick}
        </span>
      </li>
      <li className="list-group-item d-flex justify-content-between align-items-center">
        Bereavement
        <span className="badge badge-primary badge-pill">
          {user_detail.bereavement}
        </span>
      </li>
      <li className="list-group-item d-flex justify-content-between align-items-center">
        Family care
        <span className="badge badge-primary badge-pill">
          {user_detail.familyCare}
        </span>
      </li>
      <li className="list-group-item d-flex justify-content-between align-items-center">
        Christmas
        <span className="badge badge-primary badge-pill">
          {user_detail.christmas}
        </span>
      </li>
      {gender === 'female' && user_detail.maternity > 0 && (
        <li className="list-group-item d-flex justify-content-between align-items-center">
          Maternity
          <span className="badge badge-primary badge-pill">
            {user_detail.maternity}
          </span>
        </li>
      )}
      {gender === 'male' && user_detail.paternity > 0 && (
        <li className="list-group-item d-flex justify-content-between align-items-center">
          Paternity
          <span className="badge badge-primary badge-pill">
            {user_detail.paternity}
          </span>
        </li>
      )}
    </ul>
  );
}

type leaveApplicationProps = {
  id: Number,
  user_detail: Object,
  user_record: Object,
  public_holiday: Object,
  refetch: Function
};

// type leaveApplicationState = {
//   leave: string,
//   leaveType: string,
//   startDate: any,
//   endDate: any,
//   supervisorEmail: string,
//   secretaryEmail: string,
//   reason: string,
//   sickSheet: any,
//   errorMessage: string,
//   checkingMessage: string,
//   focusedInput: ?boolean
// };

function LeaveApplication(props: leaveApplicationProps) {
  const [leave, setLeave] = useState('');
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [supervisorEmail, setSupervisorEmail] = useState('');
  const [secretaryEmail, setSecretaryEmail] = useState('');
  const [reason, setReason] = useState('');
  const [sickSheet, setSickSheet] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serverMessage, setServerMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  function handleLeaveChange({ target }: SyntheticInputEvent<>) {
    setLeave(target.value);
  }

  function handleLeaveTypeChange({ target }: SyntheticInputEvent<>) {
    setLeaveType(target.value);
  }

  function handleSupervisorEmailChange({ target }: SyntheticInputEvent<>) {
    setSupervisorEmail(target.value);
  }

  function handleSecretaryEmailChange({ target }: SyntheticInputEvent<>) {
    setSecretaryEmail(target.value);
  }

  function handleReasonChange({ target }: SyntheticInputEvent<>) {
    setReason(target.value);
  }

  function handleFileChange({ target }: SyntheticInputEvent<>) {
    setSickSheet(target.files[0]);
  }

  function handleSubmit(e: Event) {
    e.preventDefault();
    const { user_detail, user_record, refetch } = props;

    const user_id = user_detail.dbId;
    const annualDays = user_detail.annual;
    const sickDays = user_detail.sick;
    const bereavementDays = user_detail.bereavement;
    const christmasDays = user_detail.christmas;
    const dateOfBirth = user_detail.dateOfBirth;
    const familyCareDays = user_detail.familyCare;
    const maternityDays = user_detail.maternity ? user_detail.maternity : null;
    const paternityDays = user_detail.paternity ? user_detail.paternity : null;
    const designation = user_detail.designation;

    if (
      !user_id ||
      !leave ||
      !leaveType ||
      !startDate ||
      !endDate ||
      !supervisorEmail ||
      !reason
    ) {
      setErrorMessage('One or more required fields are missing!');
      return;
    }

    // get date range from user selection
    const leaveRangeDays = endDate.diff(startDate, 'days') + 1;

    // check user data range selection
    if (leaveRangeDays <= 0) {
      setErrorMessage('The dates you selected are invalid!');
      return;
    }

    // create date range
    const range = moment.range(startDate, endDate);

    const dateRange = [];
    for (let numDays of range.by('days')) {
      dateRange.push(numDays.format('DD, MM, YYYY'));
    }

    const weekend = [];
    for (let numWeekends of range.by('days')) {
      if (numWeekends.isoWeekday() === 6 || numWeekends.isoWeekday() === 7) {
        weekend.push(numWeekends.format('DD, MM, YYYY'));
      }
    }

    // exclude weekends
    const dateRangeSet = new Set(dateRange);
    const weekendSet = new Set(weekend);
    const daysExcludingWeekendSet = new Set(
      [...dateRangeSet].filter(x => !weekendSet.has(x))
    );

    // exclude public holidays
    const publicHolidays = props.public_holiday.edges.map(item => {
      let hDate = new Date(item.node.holidayDate);
      let holiday_date = moment(hDate).format('DD, MM, YYYY');
      return holiday_date;
    });

    const publicHolidaysSet = new Set(publicHolidays);
    const daysExcludingHolidaysSet = new Set(
      [...daysExcludingWeekendSet].filter(x => !publicHolidaysSet.has(x))
    );
    const leaveDays = daysExcludingHolidaysSet.size;

    // since maternity leave is for consecutive days (do not exclude weekends)
    const daysExcludingOnlyPublicHolidaysSet = new Set(
      [...dateRangeSet].filter(x => !publicHolidaysSet.has(x))
    );
    const maternityLeaveDays = daysExcludingOnlyPublicHolidaysSet.size;

    if (leave === 'maternity' && maternityLeaveDays === 0) {
      setErrorMessage('The dates you selected either fall on public holiday!');
      return;
    }

    // if half day then subtract 0.5
    const myMaternityDays =
      leaveType === 'half day am' || leaveType === 'half day pm'
        ? maternityLeaveDays - 0.5
        : maternityLeaveDays;

    if (leaveDays === 0) {
      setErrorMessage(
        'The dates you selected either fall on public holiday, Saturday or Sunday!'
      );
      return;
    }

    // if half day then subtract 0.5
    const myLeaveDays =
      leaveType === 'half day am' || leaveType === 'half day pm'
        ? leaveDays - 0.5
        : leaveDays;

    // get total of approved single sick leave days
    const approvedSingleSickLeaves = user_record.leaverecord.edges.filter(
      e =>
        e.node.leaveStatus === 'approved' &&
        e.node.leaveName === 'sick' &&
        e.node.fileName === null &&
        e.node.leaveDays === 1
    );

    // calculate total leave days
    function getLeaveDays(type) {
      const totalDays = {
        annual: function() {
          return annualDays - myLeaveDays;
        },
        sick: function() {
          return (myLeaveDays >= 2 || approvedSingleSickLeaves.length >= 4) &&
            !sickSheet
            ? null
            : sickDays - myLeaveDays;
        },
        bereavement: function() {
          return bereavementDays - myLeaveDays;
        },
        christmas: function() {
          return christmasDays - myLeaveDays;
        },
        birthday: function() {
          return moment(startDate).format('DD-MM') ===
            moment(dateOfBirth).format('DD-MM') &&
            moment(endDate).format('DD-MM') ===
              moment(dateOfBirth).format('DD-MM')
            ? 'myLeaveDays'
            : undefined;
        },
        'family care': function() {
          return familyCareDays - myLeaveDays;
        },
        maternity: function() {
          if (!sickSheet) {
            return false;
          } else {
            if (maternityDays) {
              return maternityDays - myMaternityDays;
            }
          }
        },
        paternity: function() {
          if (paternityDays) {
            return paternityDays - myLeaveDays;
          }
        },
        lwop: function() {
          return myLeaveDays;
        },
        other: function() {
          return myLeaveDays;
        }
      };
      return totalDays[type]();
    }

    const applicationDays: any = getLeaveDays(leave);

    if (applicationDays < 0) {
      setErrorMessage('Your leave balance cannot be negative!');
      return;
    }

    if (applicationDays === false) {
      setErrorMessage('A medical certificate is required for maternity leave!');
      return;
    }

    if (applicationDays === null) {
      setErrorMessage(
        'A medical certificate is required for absence of two consecutive days or more and after four single day absences!'
      );
      return;
    }

    if (applicationDays === undefined) {
      setErrorMessage(
        'The date you selected as your date of birth does not match our record!'
      );
      return;
    }

    const sDate = moment(startDate).format('DD/MM/YYYY');
    const eDate = moment(endDate).format('DD/MM/YYYY');

    setErrorMessage('');
    setServerMessage('');

    const applicationDetails = {
      user_id: user_id,
      leave: leave,
      leaveType: leaveType,
      startDate: sDate,
      endDate: eDate,
      supervisorEmail: supervisorEmail,
      secretaryEmail: secretaryEmail,
      reason: reason,
      leaveDays: myLeaveDays,
      applicationDays: applicationDays,
      sickSheet: sickSheet,
      designation: designation
    };

    fetchLeaveApplication(applicationDetails);

    refetch();
  }

  const { user_detail } = props;
  let gender = user_detail.gender ? user_detail.gender.toLowerCase() : null;

  async function fetchLeaveApplication(applicationDetails) {
    setLoading(true);

    try {
      let data = new FormData();
      data.append('user_id', applicationDetails.user_id);
      data.append('leave', applicationDetails.leave);
      data.append('leaveType', applicationDetails.leaveType);
      data.append('startDate', applicationDetails.startDate);
      data.append('endDate', applicationDetails.endDate);
      data.append('supervisorEmail', applicationDetails.supervisorEmail);
      data.append('secretaryEmail', applicationDetails.secretaryEmail);
      data.append('leaveDays', applicationDetails.leaveDays);
      data.append('applicationDays', applicationDetails.applicationDays);
      data.append('reason', applicationDetails.reason);
      data.append('sickSheet', applicationDetails.sickSheet);
      data.append('designation', applicationDetails.designation);

      const response = await axios.post(
        'http://localhost:8000/applyforleave',
        data
      );

      setLoading(false);

      if (response.status !== 201) {
        setErrorMessage(response.data.message);
      } else {
        setServerMessage(response.data.message);
        setStartDate(null);
        setEndDate(null);
        setLeave('');
        setLeaveType('');
        setStartDate(null);
        setEndDate(null);
        setSupervisorEmail('');
        setSecretaryEmail('');
        setReason('');
        setSickSheet('');
        setFocusedInput(null);
      }
    } catch (error) {
      console.log(error);
      setLoading(false);
      setErrorMessage(error.message);
    }
  }

  return (
    <div className="card card-body shadow p-3 mb-5 bg-white rounded">
      <form encType="multipart/form-data" onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6">
            <div className="form-group">
              <label htmlFor="leave">Leave</label>
              <select
                className="form-control"
                id="leave"
                onChange={handleLeaveChange}
              >
                <option />
                <option>annual</option>
                <option>sick</option>
                <option>bereavement</option>
                <option>family care</option>
                <option>christmas</option>
                <option>birthday</option>
                {gender === 'female' && user_detail.maternity > 0 && (
                  <option>maternity</option>
                )}
                {gender === 'male' && user_detail.paternity > 0 && (
                  <option>paternity</option>
                )}
                <option>lwop</option>
                <option>other</option>
              </select>
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group">
              <label htmlFor="leaveType">Leave type</label>
              <select
                className="form-control"
                id="leaveType"
                onChange={handleLeaveTypeChange}
              >
                <option />
                <option>full</option>
                <option>half day am</option>
                <option>half day pm</option>
              </select>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col">
            <div className="form-group">
              <label htmlFor="startDate-endDate">Start date - End date</label>
              <DateRangePicker
                startDateId="startDate"
                endDateId="endDate"
                startDate={startDate}
                endDate={endDate}
                onDatesChange={({ startDate, endDate }) => {
                  setStartDate(startDate);
                  setEndDate(endDate);
                }}
                focusedInput={focusedInput}
                onFocusChange={focusedInput => setFocusedInput(focusedInput)}
                isOutsideRange={() => false}
                minimumNights={0}
                showDefaultInputIcon
                showClearDates
                withPortal
                displayFormat="DD/MM/YYYY"
                hideKeyboardShortcutsPanel
                renderCalendarInfo={() => (
                  <p className="text-center font-italic">
                    To select a single day click the date twice.
                  </p>
                )}
              />
            </div>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="supervisorEmail">Supervisor email</label>
          <input
            type="email"
            className="form-control"
            placeholder="Supervisor email"
            id="supervisorEmail"
            onChange={handleSupervisorEmailChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="secretaryEmail">
            Second supervisor / secretary email
          </label>
          <input
            type="email"
            className="form-control"
            placeholder="Second supervisor / secretary email"
            id="secretaryEmail"
            onChange={handleSecretaryEmailChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="reason">Reason</label>
          <input
            type="text"
            className="form-control"
            placeholder="Reason for leave"
            id="reason"
            onChange={handleReasonChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="sicksheet">Sick sheet</label>
          <input
            type="file"
            className="form-control-file"
            id="sicksheet"
            onChange={handleFileChange}
          />
          <small className="form-text text-muted">
            A medical certificate is required for absence of two consecutive
            days or more and after four single day absences.
          </small>
        </div>
        <div className="form-group">
          <button type="submit" className="btn btn-primary col">
            Submit
          </button>
        </div>
      </form>
      <div className="text-primary text-center">
        {loading ? <div className="loader" /> : serverMessage}
      </div>
      <div className="text-danger text-center pt-2">
        <div>{errorMessage}</div>
      </div>
    </div>
  );
}

type Props = {
  id: any
};

export default function Application(props: Props) {
  const { id } = props;

  return (
    <Query query={USER_DETAIL} variables={{ id: id }} pollInterval={60000}>
      {({ loading, error, data: { user }, refetch }) => (
        <Query query={USER_RECORD} variables={{ id: id }} pollInterval={60000}>
          {({
            loading: recordLoading,
            error: recordError,
            data: { user: userRecord }
          }) => (
            <Query query={PUBLIC_HOLIDAY}>
              {({
                loading: holidayLoading,
                error: holidayError,
                data: { publicHoliday }
              }) => {
                if (loading || recordLoading || holidayLoading) {
                  return (
                    <div
                      className="container text-center"
                      style={{ paddingTop: '80px' }}
                    >
                      <div className="col-md-8 ml-auto mr-auto">
                        <div className="loader" />
                      </div>
                    </div>
                  );
                }

                if (error || recordError || holidayError) {
                  console.log(
                    error.message,
                    recordError.message,
                    holidayError.message
                  );
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

                return (
                  <div className="container">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="col-md-9 ml-auto mr-auto">
                          <UserName user_detail={user} />
                        </div>
                      </div>
                      <div className="col-md-3 ml-auto">
                        <UserRecord user_detail={user} />
                      </div>
                      <div className="col-md-6 mr-auto mb-2">
                        <LeaveApplication
                          id={id}
                          user_detail={user}
                          user_record={userRecord}
                          public_holiday={publicHoliday}
                          refetch={refetch}
                        />
                      </div>
                    </div>
                  </div>
                );
              }}
            </Query>
          )}
        </Query>
      )}
    </Query>
  );
}
