// Minimal mock for firebase/firestore Timestamp used in Storybook
export class Timestamp {
  seconds: number;
  nanoseconds: number;

  constructor(seconds: number, nanoseconds: number) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }

  toDate(): Date {
    return new Date(this.seconds * 1000);
  }

  static now(): Timestamp {
    return new Timestamp(Math.floor(Date.now() / 1000), 0);
  }
}
