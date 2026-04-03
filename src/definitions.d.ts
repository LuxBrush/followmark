type Mark = {
  bookmarkID: string;
  hostname: string;
  progress: string;
  title: string;
  favIconUrl: string;
};

type FollowMarks = Record<string, Mark>;

type FollowMarkVersion = string;

type FollowMarkStorage = {
  followMarkVersion?: FollowMarkVersion;
  followMarks?: FollowMarks;
};

type Versions = [number, number, number];
