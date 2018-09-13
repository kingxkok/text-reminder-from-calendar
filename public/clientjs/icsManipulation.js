const ICAL = {};

ICAL.extractCalendarData = icsString => {
  const lineBreak = /\r\n|\r|\n/;
  const SUMMARY = 'SUMMARY',
    DTSTART = 'DTSTART',
    LOCATION = 'LOCATION',
    TZID_DELIM = 'TZID';

  let calendarDataObject = {
    timezones: {},
    events: []
  };

  const metaDataString = icsString.slice(0, icsString.indexOf('BEGIN:VEVENT'));
  const timezonesStringArray = metaDataString
    .slice(
      metaDataString.indexOf('BEGIN:VTIMEZONE'),
      metaDataString.indexOf('END:VTIMEZONE')
    )
    .split(TZID_DELIM)
    .slice(1)
    .map(elem => 'TZID' + elem);

  for (vtimezone of timezonesStringArray) {
    const lines = vtimezone.split(lineBreak);
    const key = lines[0].substring('TZID:'.length);
    let currentObj;
    calendarDataObject.timezones[key] = {};
    lines.forEach((lineItem, index) => {
      let [lineItemKey, lineItemValue] = lineItem.split(':');
      if (lineItemKey === 'BEGIN') {
        calendarDataObject.timezones[key][lineItemValue] = {};
        currentObj = calendarDataObject.timezones[key][lineItemValue];
      }
      if (lineItemKey === 'RRULE') {
        const rrule = lineItemValue.split(';');
        lineItemValue = rrule.reduce((map, rruleSegment) => {
          const [key, value] = rruleSegment.split('=');
          map[key] = value;
          return map;
        }, {});
      }
      currentObj && (currentObj[lineItemKey] = lineItemValue);
    });
  }

  const eventsString = icsString.slice(
    icsString.indexOf('BEGIN:VEVENT'),
    icsString.lastIndexOf('END:VEVENT') + 10
  );

  const eventsStringArray = eventsString.split('BEGIN:VEVENT').slice(1);
  for (vevent of eventsStringArray) {
    let currentEvent = { summary: '', startTime: {}, location: '' };
    for (lineItem of vevent.split(lineBreak)) {
      if (lineItem.includes(SUMMARY))
        currentEvent.summary = lineItem.slice(SUMMARY.length + 1);
      if (lineItem.includes(DTSTART)) {
        const startTimeArray = lineItem.slice(DTSTART.length + 1).split(':');
        startTimeArray.forEach(el => {
          if (/^TZID/.test(el)) {
            const tempTZID = el.substring('TZID='.length);
            currentEvent.startTime['TZID'] = tempTZID.replace(/['"]+/g, '');
            console.log(el, 'ggwp2');
          } else {
            currentEvent.startTime.time = el;
          }
        });
      }
      if (lineItem.includes(LOCATION))
        currentEvent.location = lineItem.slice(LOCATION.length + 1);
    }
    calendarDataObject.events.push(currentEvent);
  }
  return calendarDataObject;
};

ICAL.selectTimezoneData = (year, timezone) => {
  let selectedTimezoneTypes = [];
  Object.values(timezone).forEach(timezoneType => {
    const rrule = timezoneType.RRULE;
    if (!rrule) return;

    let rruleMonth = rrule.BYMONTH;
    rruleMonth = rruleMonth.length === 1 ? '0' + rruleMonth : rruleMonth;

    let cutoffDateStr = year + '-' + rruleMonth + '-';
    const tzOffsetFrom =
      timezoneType.TZOFFSETFROM.slice(0, 3) +
      ':' +
      timezoneType.TZOFFSETFROM.slice(3);
    const tzOffsetTo =
      timezoneType.TZOFFSETTO.slice(0, 3) +
      ':' +
      timezoneType.TZOFFSETTO.slice(3);

    let rruleDay = rrule.BYDAY;

    if (rruleDay.includes('SU')) {
      let startingPointDay;
      switch (rruleDay) {
        case '1SU':
          startingPointDay = 1;
          break;
        case '2SU':
          startingPointDay = 8;
          break;
        case '3SU':
          startingPointDay = 15;
          break;
        case '-1SU':
          startingPointDay = 22; //doesn't really work. need last sunday logic
          break;
        default:
          startingPointDay = 1;
      }
      // only works if first sunday
      const firstDayOfMonth = new Date(
        cutoffDateStr + '01T00:00:00' + '+00:00'
      ).getUTCDay();
      console.log(firstDayOfMonth, startingPointDay);
      let dayToUse = startingPointDay + ((7 - firstDayOfMonth) % 7) + '';
      console.log(dayToUse, firstDayOfMonth);
      if (dayToUse.length === 1) dayToUse = '0' + dayToUse;
      cutoffDateStr += dayToUse;
      console.log(dayToUse);
    } else {
      cutoffDateStr += '01';
    }

    cutoffDateStr += 'T01:59:59' + tzOffsetFrom;

    const cutoffDate = new Date(cutoffDateStr);
    selectedTimezoneTypes.push({ cutoffDate, tzOffsetFrom, tzOffsetTo });
  });
  selectedTimezoneTypes.sort((tzType1, tzType2) => {
    return tzType1.cutoffDate > tzType2.cutoffDate;
  });
  console.log(selectedTimezoneTypes, 'slt');
  return selectedTimezoneTypes;
};
