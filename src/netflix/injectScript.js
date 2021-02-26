const WEBVTT = 'webvtt-lssdh-ios8';
const DFXP = 'dfxp-ls-sdh';
const SIMPLE = 'simplesdh';
const ALL_FORMATS = [WEBVTT, DFXP, SIMPLE];

const FORMAT_NAMES = {};
FORMAT_NAMES[WEBVTT] = 'WebVTT';
FORMAT_NAMES[DFXP] = 'DFXP/XML';

const EXTENSIONS = {};
EXTENSIONS[WEBVTT] = 'vtt';
EXTENSIONS[DFXP] = 'dfxp';
EXTENSIONS[SIMPLE] = 'xml';

const SUB_TYPES = {
  subtitles: '',
  closedcaptions: '[cc]',
};

const idOverrides = {};
const subCache = {};

const processSubInfo = async result => {
  const tracks = result.timedtexttracks;
  //   const titleP = await getTitle();
  const subs = {};
  for (const track of tracks) {
    if (track.isNoneTrack) continue;

    let type = SUB_TYPES[track.rawTrackType];
    if (typeof type === 'undefined') type = `[${track.rawTrackType}]`;
    const lang = track.language + type + (track.isForcedNarrative ? '-forced' : '');

    const formats = {};
    for (let format of ALL_FORMATS) {
      if (typeof track.ttDownloadables[format] !== 'undefined')
        formats[format] = [Object.values(track.ttDownloadables[format].downloadUrls), EXTENSIONS[format]];
    }

    if (Object.keys(formats).length > 0) subs[lang] = formats;
  }
  subCache[result.movieId] = { subs };

  console.log({ result, subs });
};

const processMessage = e => {
  const override = e.detail.id_override;
  if (typeof override !== 'undefined') idOverrides[override[0]] = override[1];
  else processSubInfo(e.detail);
};

const injection = () => {
  const WEBVTT = 'webvtt-lssdh-ios8';
  const MANIFEST_PATTERN = new RegExp('manifest|licensedManifest');

  // hijack JSON.parse and JSON.stringify functions
  ((parse, stringify) => {
    JSON.parse = function (text) {
      const data = parse(text);
      if (data && data.result && data.result.timedtexttracks && data.result.movieId) {
        window.dispatchEvent(new CustomEvent('netflix_sub_downloader_data', { detail: data.result }));
      }
      return data;
    };
    JSON.stringify = function (data) {
      /*{
            let text = stringify(data);
            if (text.includes('dfxp-ls-sdh'))
              console.log(text, data);
          }*/
      if (data && typeof data.url === 'string' && data.url.search(MANIFEST_PATTERN) > -1) {
        for (let v of Object.values(data)) {
          try {
            if (v.profiles) v.profiles.unshift(WEBVTT);
            if (v.showAllSubDubTracks != null) v.showAllSubDubTracks = true;
          } catch (e) {
            if (e instanceof TypeError) continue;
            else throw e;
          }
        }
      }
      if (data && typeof data.movieId === 'number') {
        try {
          let videoId = data.params.sessionParams.uiplaycontext.video_id;
          if (typeof videoId === 'number' && videoId !== data.movieId)
            window.dispatchEvent(new CustomEvent('netflix_sub_downloader_data', { detail: { id_override: [videoId, data.movieId] } }));
        } catch (ignore) {}
      }
      return stringify(data);
    };
  })(JSON.parse, JSON.stringify);
};

injection();

window.addEventListener('netflix_sub_downloader_data', processMessage, false);
