type Page = {
  bookmarkID: string;
  title: string;
  urlString: string;
  favIconUrl: string;
};

type Mark = {
  hostname: string;
  pages: Record<string, Page>;
};

type FollowMarks = Record<string, Mark>;

type FollowMarkVersion = string;

type FollowMarkStorage = {
  followMarkVersion?: FollowMarkVersion;
  followMarks?: FollowMarks;
};

type Versions = [number, number, number];

type PageKeyExtractor = (hostname: string, title: string, href: string) => string | null;
