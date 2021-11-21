import ms from 'ms';

// Air-lifted and converted to ts
// Source - https://github.com/auth0/node-jsonwebtoken/blob/74d5719bd03993fcf71e3b176621f133eb6138c0/lib/timespan.js
export default function timespan(time: string | number, iat?: number) {
  const timestamp = iat || Math.floor(Date.now() / 1000);

  if (typeof time === 'string') {
    const milliseconds = ms(time);
    if (typeof milliseconds === 'undefined') {
      return;
    }

    return Math.floor(timestamp + milliseconds / 1000);
  } else if (typeof time === 'number') {
    return timestamp + time;
  } else {
    return;
  }
}
