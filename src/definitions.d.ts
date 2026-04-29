type Page = {
  bookmarkID: string;
  title: string;
  urlString: string;
};

type Mark = {
  hostname: string;
  favIconUrl: string;
  pages: Record<string, Page>;
};

type FollowMarks = Record<string, Mark>;

type FollowMarkVersion = string;

type FollowMarkStorage = {
  followMarkVersion?: FollowMarkVersion;
  followMarks?: FollowMarks;
};

type Versions = [number, number, number];
