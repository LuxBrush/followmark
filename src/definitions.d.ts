type Item = {
  bookmarkID: string;
  title: string;
  urlString: string;
};

type Mark = {
  hostname: string;
  favIconUrl: string;
  items: Record<string, Item>;
};

type FollowMarks = Record<string, Mark>;

type FollowMarkVersion = string;

type FollowMarkStorage = {
  followMarkVersion?: FollowMarkVersion;
  followMarks?: FollowMarks;
};

type Versions = [number, number, number];
