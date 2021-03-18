// Ref. https://gist.github.com/rodrigoborgesdeoliveira/987683cfbfcc8d800192da1e73adc486
/* eslint prefer-regex-literals: 0 */

import { getVideoID } from './transcriptaze.js'

const URLs = [
  { url: 'https://www.youtube.com/watch?v=peFZbP64dsU', vid: 'peFZbP64dsU' },
  { url: 'https://www.youtube.com/watch?v=-wtIMTCHWuI', vid: '-wtIMTCHWuI' },
  { url: 'http://www.youtube.com/watch?v=-wtIMTCHWuI', vid: '-wtIMTCHWuI' },
  { url: 'https://www.youtube.com/watch?v=0zM3nApSvMg#t=0m10s', vid: '0zM3nApSvMg' },
  { url: 'http://www.youtube.com/watch?v=cKZDdG9FTKY&feature=channel', vid: 'cKZDdG9FTKY' },
  { url: 'https://www.youtube.com/watch?v=yZv2daTWRZU&feature=em-uploademail', vid: 'yZv2daTWRZU' },
  { url: 'https://www.youtube.com/watch?v=0zM3nApSvMg&feature=feedrec_grec_index', vid: '0zM3nApSvMg' },
  { url: 'http://www.youtube.com/watch?v=yZ-K7nCVnBI&playnext_from=TL&videos=osPknwzXEas&feature=sub', vid: 'yZ-K7nCVnBI' },
  { url: 'http://www.youtube.com/watch?v=6dwqZw0j_jY&feature=youtu.be', vid: '6dwqZw0j_jY' },
  { url: 'http://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=youtube_gdata_player', vid: 'dQw4w9WgXcQ' },
  { url: 'http://www.youtube.com/watch?v=0zM3nApSvMg&feature=feedrec_grec_index', vid: '0zM3nApSvMg' },
  { url: 'http://www.youtube.com/watch?v=0zM3nApSvMg#t=0m10s', vid: '0zM3nApSvMg' },
  { url: 'https://www.youtube.com/watch?v=ishbTyLs6ps&list=PLGup6kBfcU7Le5laEaCLgTKtlDcxMqGxZ&index=106&shuffle=2655', vid: 'ishbTyLs6ps' },
  { url: 'http://www.youtube.com/watch?v=oTJRivZTMLs&feature=youtu.be', vid: 'oTJRivZTMLs' },
  { url: 'http://youtube.com/watch?v=oTJRivZTMLs&feature=channel', vid: 'oTJRivZTMLs' },
  { url: 'https://m.youtube.com/watch?v=m_kbvp0_8tc', vid: 'm_kbvp0_8tc' },
  { url: 'http://www.youtube.com/ytscreeningroom?v=NRHVzbJVx8I', vid: 'NRHVzbJVx8I' },
  { url: 'http://www.youtube.com/?v=dQw4w9WgXcQ', vid: 'dQw4w9WgXcQ' },
  { url: 'http://youtube.com/watch?v=dQw4w9WgXcQ&feature=youtube_gdata_player', vid: 'dQw4w9WgXcQ' },
  { url: 'http://www.youtube.com/watch?feature=player_embedded&v=dQw4w9WgXcQ', vid: 'dQw4w9WgXcQ' },
  { url: 'http://youtube.com/?v=dQw4w9WgXcQ&feature=youtube_gdata_player', vid: 'dQw4w9WgXcQ' },
  { url: 'http://youtube.com/?vi=dQw4w9WgXcQ&feature=youtube_gdata_player', vid: 'dQw4w9WgXcQ' },
  { url: 'http://www.youtube.com/?feature=player_embedded&v=dQw4w9WgXcQ', vid: 'dQw4w9WgXcQ' },
  { url: 'http://youtube.com/?vi=oTJRivZTMLs&feature=channel', vid: 'oTJRivZTMLs' },
  { url: 'http://youtube.com/?feature=channel&v=oTJRivZTMLs', vid: 'oTJRivZTMLs' },
  { url: 'http://youtube.com/?v=oTJRivZTMLs&feature=channel', vid: 'oTJRivZTMLs' },
  { url: 'http://www.youtube.com/ytscreeningroom?v=oTJRivZTMLs', vid: 'oTJRivZTMLs' },

  { url: 'http://youtube.com/watch?vi=oTJRivZTMLs&feature=channel', vid: 'oTJRivZTMLs' },
  { url: 'http://youtube.com/watch?vi=dQw4w9WgXcQ&feature=youtube_gdata_player', vid: 'dQw4w9WgXcQ' },

  { url: 'https://www.youtube.com/v/dQw4w9WgXcQ', vid: 'dQw4w9WgXcQ' },
  { url: 'http://www.youtube.com/v/dQw4w9WgXcQ', vid: 'dQw4w9WgXcQ' },
  { url: 'https://www.youtube.com/v/-wtIMTCHWuI?version=3&autohide=1', vid: '-wtIMTCHWuI' },
  { url: 'https://www.youtube.com/v/0zM3nApSvMg?fs=1&amp;hl=en_US&amp;rel=0', vid: '0zM3nApSvMg' },
  { url: 'http://www.youtube.com/v/0zM3nApSvMg?fs=1&hl=en_US&rel=0', vid: '0zM3nApSvMg' },
  { url: 'http://www.youtube-nocookie.com/v/6L3ZvIMwZFM?version=3&hl=en_US&rel=0', vid: '6L3ZvIMwZFM' },
  { url: 'http://youtube.com/v/dQw4w9WgXcQ?feature=youtube_gdata_player', vid: 'dQw4w9WgXcQ' },
  { url: 'http://youtube.com/vi/dQw4w9WgXcQ?feature=youtube_gdata_player', vid: 'dQw4w9WgXcQ' },
  { url: 'http://youtube.com/vi/oTJRivZTMLs&feature=channel', vid: 'oTJRivZTMLs' },

  { url: 'http://www.youtube.com/embed/dQw4w9WgXcQ', vid: 'dQw4w9WgXcQ' },
  { url: 'http://www.youtube.com/embed/nas1rJpm7wY?rel=0', vid: 'nas1rJpm7wY' },
  { url: 'https://www.youtube.com/embed/0zM3nApSvMg?rel=0', vid: '0zM3nApSvMg' },
  { url: 'http://www.youtube.com/embed/oTJRivZTMLs?rel=0', vid: 'oTJRivZTMLs' },
  { url: 'www.youtube-nocookie.com/embed/up_lNV-yoK4?rel=0', vid: 'up_lNV-yoK4' },
  { url: 'https://www.youtube-nocookie.com/embed/up_lNV-yoK4?rel=0', vid: 'up_lNV-yoK4' },
  { url: 'http://www.youtube.com/e/dQw4w9WgXcQ', vid: 'dQw4w9WgXcQ' },

  { url: 'https://youtu.be/-wtIMTCHWuI', vid: '-wtIMTCHWuI' },
  { url: 'http://youtu.be/-wtIMTCHWuI', vid: '-wtIMTCHWuI' },
  { url: 'http://youtu.be/oTJRivZTMLs&feature=channel', vid: 'oTJRivZTMLs' },
  { url: 'http://youtu.be/dQw4w9WgXcQ?feature=youtube_gdata_player', vid: 'dQw4w9WgXcQ' },
  { url: 'https://youtu.be/oTJRivZTMLs?list=PLToa5JuFMsXTNkrLJbRlB--76IAOjRM9b', vid: 'oTJRivZTMLs' },

  { url: 'https://www.youtube.com/user/IngridMichaelsonVEVO#p/a/u/1/QdK8U-VIH_o', vid: 'QdK8U-VIH_o' },
  { url: 'http://www.youtube.com/user/SilkRoadTheatre#p/a/u/2/6dwqZw0j_jY', vid: '6dwqZw0j_jY' },
  { url: 'http://www.youtube.com/user/IngridMichaelsonVEVO#p/u/11/KdwsulMb8EQ', vid: 'KdwsulMb8EQ' },
  { url: 'http://www.youtube.com/user/dreamtheater#p/u/1/oTJRivZTMLs', vid: 'oTJRivZTMLs' },
  { url: 'http://www.youtube.com/user/Scobleizer#p/u/1/1p3vcRhsYGo?rel=0', vid: '1p3vcRhsYGo' },
  { url: 'http://www.youtube.com/user/Scobleizer#p/u/1/1p3vcRhsYGo', vid: '1p3vcRhsYGo' },

  { url: 'https://www.youtube.com/attribution_link?a=8g8kPrPIi-ecwIsS&u=/watch%3Fv%3DyZv2daTWRZU%26feature%3Dem-uploademail', vid: 'yZv2daTWRZU' },
  { url: 'http://www.youtube.com/attribution_link?a=JdfC0C9V6ZI&u=%2Fwatch%3Fv%3DEhxJLojIE_o%26feature%3Dshare', vid: 'EhxJLojIE_o' },

  { url: 'http://www.youtube.com/oembed?url=http%3A//www.youtube.com/watch?v%3D-wtIMTCHWuI&format=json', vid: '-wtIMTCHWuI' }
]

function testGetYouTubeVideoID () {
  URLs.forEach(v => {
    const vid = getVideoID(v.url)
    if (vid !== v.vid) {
      throw Error('Incorrect VID for ' + v.url + ' - expected:' + v.vid + ', got:' + vid)
    }
  })
}

testGetYouTubeVideoID()
