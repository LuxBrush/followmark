type Mark = {
  id: string;
  favIconUrl: string;
};

type FollowMarks = Record<string, Mark>;

type FollowMarkVersion = string;

type FollowMarkStorage = {
  followMarkVersion?: FollowMarkVersion;
  followMarks?: FollowMarks;
};
