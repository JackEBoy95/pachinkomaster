import { useState, useMemo } from 'react'
import styles from './PlayerPanel.module.css'
import { FLAGS } from '../flagData/flagData.js'
const CDN = 'https://hatscripts.github.io/circle-flags/flags'

const EMOJI_PAGE_SIZE = 80

// Lazy-loaded on first emoji tab open — avoids ~40KB in the initial bundle
let _ballSkinsCache = null
async function loadBallSkins() {
  if (!_ballSkinsCache) {
    const m = await import('../emojiData/ballSkins.js')
    _ballSkinsCache = m.default
  }
  return _ballSkinsCache
}

// Convert an OpenMoji codepoint string (e.g. '1F600' or '0023-FE0F-20E3') to a Unicode character
function cpToChar(cp) {
  try {
    return cp.split('-').map(h => String.fromCodePoint(parseInt(h, 16))).join('')
  } catch { return '' }
}

// Circle-flag skins — each id is cflag:{ISO 3166-1 alpha-2 code}
export const CIRCLE_FLAG_CATEGORIES = [
  {
    label: 'Americas',
    skins: [
      { id: 'cflag:ag',    label: 'Antigua and Barbuda',              code: 'ag' },
      { id: 'cflag:ai',    label: 'Anguilla',                         code: 'ai' },
      { id: 'cflag:an',    label: 'Netherlands Antilles',             code: 'an' },
      { id: 'cflag:ar',    label: 'Argentina',                        code: 'ar' },
      { id: 'cflag:aw',    label: 'Aruba',                            code: 'aw' },
      { id: 'cflag:bb',    label: 'Barbados',                         code: 'bb' },
      { id: 'cflag:bl',    label: 'Saint Barthélemy',                 code: 'bl' },
      { id: 'cflag:bm',    label: 'Bermuda',                          code: 'bm' },
      { id: 'cflag:bo',    label: 'Bolivia',                          code: 'bo' },
      { id: 'cflag:bq-bo', label: 'Bonaire',                          code: 'bq-bo' },
      { id: 'cflag:bq-sa', label: 'Saba',                             code: 'bq-sa' },
      { id: 'cflag:bq-se', label: 'Sint Eustatius',                   code: 'bq-se' },
      { id: 'cflag:br',    label: 'Brazil',                           code: 'br' },
      { id: 'cflag:bs',    label: 'Bahamas',                          code: 'bs' },
      { id: 'cflag:bz',    label: 'Belize',                           code: 'bz' },
      { id: 'cflag:ca',    label: 'Canada',                           code: 'ca' },
      { id: 'cflag:ca-bc', label: 'British Columbia',                 code: 'ca-bc' },
      { id: 'cflag:ca-qc', label: 'Quebec',                           code: 'ca-qc' },
      { id: 'cflag:cl',    label: 'Chile',                            code: 'cl' },
      { id: 'cflag:co',    label: 'Colombia',                         code: 'co' },
      { id: 'cflag:cr',    label: 'Costa Rica',                       code: 'cr' },
      { id: 'cflag:cu',    label: 'Cuba',                             code: 'cu' },
      { id: 'cflag:cw',    label: 'Curaçao',                          code: 'cw' },
      { id: 'cflag:dm',    label: 'Dominica',                         code: 'dm' },
      { id: 'cflag:do',    label: 'Dominican Republic',               code: 'do' },
      { id: 'cflag:ec',    label: 'Ecuador',                          code: 'ec' },
      { id: 'cflag:ec-w',  label: 'Galápagos',                        code: 'ec-w' },
      { id: 'cflag:fk',    label: 'Falkland Islands',                 code: 'fk' },
      { id: 'cflag:fr-cp', label: 'Clipperton Island',                code: 'fr-cp' },
      { id: 'cflag:gd',    label: 'Grenada',                          code: 'gd' },
      { id: 'cflag:gf',    label: 'French Guiana',                    code: 'gf' },
      { id: 'cflag:gl',    label: 'Greenland',                        code: 'gl' },
      { id: 'cflag:gp',    label: 'Guadeloupe',                       code: 'gp' },
      { id: 'cflag:gt',    label: 'Guatemala',                        code: 'gt' },
      { id: 'cflag:gy',    label: 'Guyana',                           code: 'gy' },
      { id: 'cflag:hn',    label: 'Honduras',                         code: 'hn' },
      { id: 'cflag:ht',    label: 'Haiti',                            code: 'ht' },
      { id: 'cflag:jm',    label: 'Jamaica',                          code: 'jm' },
      { id: 'cflag:kn',    label: 'Saint Kitts and Nevis',            code: 'kn' },
      { id: 'cflag:ky',    label: 'Cayman Islands',                   code: 'ky' },
      { id: 'cflag:lc',    label: 'Saint Lucia',                      code: 'lc' },
      { id: 'cflag:mf',    label: 'Saint-Martin',                     code: 'mf' },
      { id: 'cflag:mq',    label: 'Martinique',                       code: 'mq' },
      { id: 'cflag:ms',    label: 'Montserrat',                       code: 'ms' },
      { id: 'cflag:mx',    label: 'Mexico',                           code: 'mx' },
      { id: 'cflag:ni',    label: 'Nicaragua',                        code: 'ni' },
      { id: 'cflag:pa',    label: 'Panama',                           code: 'pa' },
      { id: 'cflag:pe',    label: 'Peru',                             code: 'pe' },
      { id: 'cflag:pm',    label: 'Saint Pierre and Miquelon',        code: 'pm' },
      { id: 'cflag:pr',    label: 'Puerto Rico',                      code: 'pr' },
      { id: 'cflag:py',    label: 'Paraguay',                         code: 'py' },
      { id: 'cflag:sr',    label: 'Suriname',                         code: 'sr' },
      { id: 'cflag:sv',    label: 'El Salvador',                      code: 'sv' },
      { id: 'cflag:sx',    label: 'Sint Maarten',                     code: 'sx' },
      { id: 'cflag:tc',    label: 'Turks and Caicos Islands',         code: 'tc' },
      { id: 'cflag:tt',    label: 'Trinidad and Tobago',              code: 'tt' },
      { id: 'cflag:us',    label: 'United States',        code: 'us' },
      { id: 'cflag:uy',    label: 'Uruguay',                          code: 'uy' },
      { id: 'cflag:vc',    label: 'Saint Vincent and the Grenadines', code: 'vc' },
      { id: 'cflag:ve',    label: 'Venezuela',                        code: 've' },
      { id: 'cflag:vg',    label: 'Virgin Islands (British)',         code: 'vg' },
      { id: 'cflag:vi',    label: 'Virgin Islands (U.S.)',            code: 'vi' },
    ],
  },
  {
    label: 'Europe',
    skins: [
      { id: 'cflag:ad',     label: 'Andorra',               code: 'ad' },
      { id: 'cflag:al',     label: 'Albania',               code: 'al' },
      { id: 'cflag:at',     label: 'Austria',               code: 'at' },
      { id: 'cflag:ax',     label: 'Åland Islands',         code: 'ax' },
      { id: 'cflag:ba',     label: 'Bosnia and Herzegovina',code: 'ba' },
      { id: 'cflag:be',     label: 'Belgium',               code: 'be' },
      { id: 'cflag:bg',     label: 'Bulgaria',              code: 'bg' },
      { id: 'cflag:by',     label: 'Belarus',               code: 'by' },
      { id: 'cflag:ch',     label: 'Switzerland',           code: 'ch' },
      { id: 'cflag:ch-gr',  label: 'Grisons',               code: 'ch-gr' },
      { id: 'cflag:cq',     label: 'Sark',                  code: 'cq' },
      { id: 'cflag:cy',     label: 'Cyprus',                code: 'cy' },
      { id: 'cflag:cz',     label: 'Czechia',               code: 'cz' },
      { id: 'cflag:de',     label: 'Germany',               code: 'de' },
      { id: 'cflag:dk',     label: 'Denmark',               code: 'dk' },
      { id: 'cflag:ee',     label: 'Estonia',               code: 'ee' },
      { id: 'cflag:es',     label: 'Spain',                 code: 'es' },
      { id: 'cflag:es-ar',  label: 'Aragon',                code: 'es-ar' },
      { id: 'cflag:es-ce',  label: 'Ceuta',                 code: 'es-ce' },
      { id: 'cflag:es-cn',  label: 'Canary Islands',        code: 'es-cn' },
      { id: 'cflag:es-ct',  label: 'Catalonia',             code: 'es-ct' },
      { id: 'cflag:es-ga',  label: 'Galicia',               code: 'es-ga' },
      { id: 'cflag:es-ib',  label: 'Balearic Islands',      code: 'es-ib' },
      { id: 'cflag:es-ml',  label: 'Melilla',               code: 'es-ml' },
      { id: 'cflag:es-pv',  label: 'Basque Country',        code: 'es-pv' },
      { id: 'cflag:es-vc',  label: 'Valencia',              code: 'es-vc' },
      { id: 'cflag:eu',     label: 'European Union',        code: 'eu' },
      { id: 'cflag:fi',     label: 'Finland',               code: 'fi' },
      { id: 'cflag:fo',     label: 'Faroe Islands',         code: 'fo' },
      { id: 'cflag:fr',     label: 'France',                code: 'fr' },
      { id: 'cflag:fr-20r', label: 'Corsica',               code: 'fr-20r' },
      { id: 'cflag:fr-bre', label: 'Brittany',              code: 'fr-bre' },
      { id: 'cflag:gb',     label: 'United Kingdom',        code: 'gb' },
      { id: 'cflag:gb-con', label: 'Cornwall',              code: 'gb-con' },
      { id: 'cflag:gb-eng', label: 'England',               code: 'gb-eng' },
      { id: 'cflag:gb-nir', label: 'Northern Ireland',      code: 'gb-nir' },
      { id: 'cflag:gb-ork', label: 'Orkney',                code: 'gb-ork' },
      { id: 'cflag:gb-sct', label: 'Scotland',              code: 'gb-sct' },
      { id: 'cflag:gb-wls', label: 'Wales',                 code: 'gb-wls' },
      { id: 'cflag:gg',     label: 'Guernsey',              code: 'gg' },
      { id: 'cflag:gi',     label: 'Gibraltar',             code: 'gi' },
      { id: 'cflag:gr',     label: 'Greece',                code: 'gr' },
      { id: 'cflag:hr',     label: 'Croatia',               code: 'hr' },
      { id: 'cflag:hu',     label: 'Hungary',               code: 'hu' },
      { id: 'cflag:ie',     label: 'Ireland',               code: 'ie' },
      { id: 'cflag:im',     label: 'Isle of Man',           code: 'im' },
      { id: 'cflag:is',     label: 'Iceland',               code: 'is' },
      { id: 'cflag:it',     label: 'Italy',                 code: 'it' },
      { id: 'cflag:it-21',  label: 'Piedmont',              code: 'it-21' },
      { id: 'cflag:it-23',  label: 'Aosta Valley',          code: 'it-23' },
      { id: 'cflag:it-25',  label: 'Lombardy',              code: 'it-25' },
      { id: 'cflag:it-32',  label: 'Trentino-Alto Adige',   code: 'it-32' },
      { id: 'cflag:it-34',  label: 'Veneto',                code: 'it-34' },
      { id: 'cflag:it-36',  label: 'Friuli Venezia Giulia', code: 'it-36' },
      { id: 'cflag:it-42',  label: 'Liguria',               code: 'it-42' },
      { id: 'cflag:it-45',  label: 'Emilia-Romagna',        code: 'it-45' },
      { id: 'cflag:it-52',  label: 'Tuscany',               code: 'it-52' },
      { id: 'cflag:it-55',  label: 'Umbria',                code: 'it-55' },
      { id: 'cflag:it-57',  label: 'Marche',                code: 'it-57' },
      { id: 'cflag:it-62',  label: 'Lazio',                 code: 'it-62' },
      { id: 'cflag:it-65',  label: 'Abruzzo',               code: 'it-65' },
      { id: 'cflag:it-67',  label: 'Molise',                code: 'it-67' },
      { id: 'cflag:it-72',  label: 'Campania',              code: 'it-72' },
      { id: 'cflag:it-75',  label: 'Apulia',                code: 'it-75' },
      { id: 'cflag:it-77',  label: 'Basilicata',            code: 'it-77' },
      { id: 'cflag:it-78',  label: 'Calabria',              code: 'it-78' },
      { id: 'cflag:it-82',  label: 'Sicily',                code: 'it-82' },
      { id: 'cflag:it-88',  label: 'Sardinia',              code: 'it-88' },
      { id: 'cflag:je',     label: 'Jersey',                code: 'je' },
      { id: 'cflag:li',     label: 'Liechtenstein',         code: 'li' },
      { id: 'cflag:lt',     label: 'Lithuania',             code: 'lt' },
      { id: 'cflag:lu',     label: 'Luxembourg',            code: 'lu' },
      { id: 'cflag:lv',     label: 'Latvia',                code: 'lv' },
      { id: 'cflag:mc',     label: 'Monaco',                code: 'mc' },
      { id: 'cflag:md',     label: 'Moldova',               code: 'md' },
      { id: 'cflag:me',     label: 'Montenegro',            code: 'me' },
      { id: 'cflag:mk',     label: 'North Macedonia',       code: 'mk' },
      { id: 'cflag:mt',     label: 'Malta',                 code: 'mt' },
      { id: 'cflag:nl',     label: 'Netherlands',           code: 'nl' },
      { id: 'cflag:nl-fr',  label: 'Friesland',             code: 'nl-fr' },
      { id: 'cflag:no',     label: 'Norway',                code: 'no' },
      { id: 'cflag:pl',     label: 'Poland',                code: 'pl' },
      { id: 'cflag:pt',     label: 'Portugal',              code: 'pt' },
      { id: 'cflag:pt-20',  label: 'Azores',                code: 'pt-20' },
      { id: 'cflag:pt-30',  label: 'Madeira',               code: 'pt-30' },
      { id: 'cflag:ro',     label: 'Romania',               code: 'ro' },
      { id: 'cflag:rs',     label: 'Serbia',                code: 'rs' },
      { id: 'cflag:ru',     label: 'Russia',                code: 'ru' },
      { id: 'cflag:ru-ba',  label: 'Bashkortostan',         code: 'ru-ba' },
      { id: 'cflag:ru-ce',  label: 'Chechnya',              code: 'ru-ce' },
      { id: 'cflag:ru-cu',  label: 'Chuvashia',             code: 'ru-cu' },
      { id: 'cflag:ru-da',  label: 'Dagestan',              code: 'ru-da' },
      { id: 'cflag:ru-ko',  label: 'Komi Republic',         code: 'ru-ko' },
      { id: 'cflag:ru-ta',  label: 'Tatarstan',             code: 'ru-ta' },
      { id: 'cflag:ru-ud',  label: 'Udmurtia',              code: 'ru-ud' },
      { id: 'cflag:se',     label: 'Sweden',                code: 'se' },
      { id: 'cflag:si',     label: 'Slovenia',              code: 'si' },
      { id: 'cflag:sj',     label: 'Svalbard and Jan Mayen',code: 'sj' },
      { id: 'cflag:sk',     label: 'Slovakia',              code: 'sk' },
      { id: 'cflag:sm',     label: 'San Marino',            code: 'sm' },
      { id: 'cflag:tr',     label: 'Turkey',                code: 'tr' },
      { id: 'cflag:ua',     label: 'Ukraine',               code: 'ua' },
      { id: 'cflag:va',     label: 'Holy See (Vatican)',     code: 'va' },
      { id: 'cflag:xk',     label: 'Kosovo',                code: 'xk' },
      { id: 'cflag:yu',     label: 'Yugoslavia',            code: 'yu' },
    ],
  },
  {
    label: 'Asia & Middle East',
    skins: [
      { id: 'cflag:ae',    label: 'United Arab Emirates', code: 'ae' },
      { id: 'cflag:af',    label: 'Afghanistan',          code: 'af' },
      { id: 'cflag:am',    label: 'Armenia',              code: 'am' },
      { id: 'cflag:az',    label: 'Azerbaijan',           code: 'az' },
      { id: 'cflag:bd',    label: 'Bangladesh',           code: 'bd' },
      { id: 'cflag:bh',    label: 'Bahrain',              code: 'bh' },
      { id: 'cflag:bn',    label: 'Brunei',               code: 'bn' },
      { id: 'cflag:bt',    label: 'Bhutan',               code: 'bt' },
      { id: 'cflag:cn',    label: 'China',                code: 'cn' },
      { id: 'cflag:cn-xj', label: 'Xinjiang',             code: 'cn-xj' },
      { id: 'cflag:cn-xz', label: 'Tibet',                code: 'cn-xz' },
      { id: 'cflag:ge',    label: 'Georgia',              code: 'ge' },
      { id: 'cflag:ge-ab', label: 'Abkhazia',             code: 'ge-ab' },
      { id: 'cflag:hk',    label: 'Hong Kong',            code: 'hk' },
      { id: 'cflag:id',    label: 'Indonesia',            code: 'id' },
      { id: 'cflag:id-jb', label: 'West Java',            code: 'id-jb' },
      { id: 'cflag:id-jt', label: 'Central Java',         code: 'id-jt' },
      { id: 'cflag:il',    label: 'Israel',               code: 'il' },
      { id: 'cflag:in',    label: 'India',                code: 'in' },
      { id: 'cflag:in-as', label: 'Assam',                code: 'in-as' },
      { id: 'cflag:in-gj', label: 'Gujarat',              code: 'in-gj' },
      { id: 'cflag:in-ka', label: 'Karnataka',            code: 'in-ka' },
      { id: 'cflag:in-mn', label: 'Manipur',              code: 'in-mn' },
      { id: 'cflag:in-mz', label: 'Mizoram',              code: 'in-mz' },
      { id: 'cflag:in-or', label: 'Odisha',               code: 'in-or' },
      { id: 'cflag:in-tg', label: 'Telangana',            code: 'in-tg' },
      { id: 'cflag:in-tn', label: 'Tamil Nadu',           code: 'in-tn' },
      { id: 'cflag:io',    label: 'British Indian Ocean Territory', code: 'io' },
      { id: 'cflag:iq',    label: 'Iraq',                 code: 'iq' },
      { id: 'cflag:iq-kr', label: 'Kurdistan',            code: 'iq-kr' },
      { id: 'cflag:ir',    label: 'Iran',                 code: 'ir' },
      { id: 'cflag:jo',    label: 'Jordan',               code: 'jo' },
      { id: 'cflag:jp',    label: 'Japan',                code: 'jp' },
      { id: 'cflag:kg',    label: 'Kyrgyzstan',           code: 'kg' },
      { id: 'cflag:kh',    label: 'Cambodia',             code: 'kh' },
      { id: 'cflag:kp',    label: 'North Korea',          code: 'kp' },
      { id: 'cflag:kr',    label: 'South Korea',          code: 'kr' },
      { id: 'cflag:kw',    label: 'Kuwait',               code: 'kw' },
      { id: 'cflag:kz',    label: 'Kazakhstan',           code: 'kz' },
      { id: 'cflag:la',    label: 'Laos',                 code: 'la' },
      { id: 'cflag:lb',    label: 'Lebanon',              code: 'lb' },
      { id: 'cflag:lk',    label: 'Sri Lanka',            code: 'lk' },
      { id: 'cflag:mm',    label: 'Myanmar',              code: 'mm' },
      { id: 'cflag:mn',    label: 'Mongolia',             code: 'mn' },
      { id: 'cflag:mo',    label: 'Macao',                code: 'mo' },
      { id: 'cflag:mv',    label: 'Maldives',             code: 'mv' },
      { id: 'cflag:my',    label: 'Malaysia',             code: 'my' },
      { id: 'cflag:np',    label: 'Nepal',                code: 'np' },
      { id: 'cflag:om',    label: 'Oman',                 code: 'om' },
      { id: 'cflag:ph',    label: 'Philippines',          code: 'ph' },
      { id: 'cflag:pk',    label: 'Pakistan',             code: 'pk' },
      { id: 'cflag:pk-jk', label: 'Azad Kashmir',         code: 'pk-jk' },
      { id: 'cflag:pk-sd', label: 'Sindh',                code: 'pk-sd' },
      { id: 'cflag:ps',    label: 'Palestine',            code: 'ps' },
      { id: 'cflag:qa',    label: 'Qatar',                code: 'qa' },
      { id: 'cflag:sa',    label: 'Saudi Arabia',         code: 'sa' },
      { id: 'cflag:sg',    label: 'Singapore',            code: 'sg' },
      { id: 'cflag:sy',    label: 'Syria',                code: 'sy' },
      { id: 'cflag:th',    label: 'Thailand',             code: 'th' },
      { id: 'cflag:tj',    label: 'Tajikistan',           code: 'tj' },
      { id: 'cflag:tl',    label: 'Timor-Leste',          code: 'tl' },
      { id: 'cflag:tm',    label: 'Turkmenistan',         code: 'tm' },
      { id: 'cflag:tw',    label: 'Taiwan',               code: 'tw' },
      { id: 'cflag:uz',    label: 'Uzbekistan',           code: 'uz' },
      { id: 'cflag:vn',    label: 'Vietnam',              code: 'vn' },
      { id: 'cflag:ye',    label: 'Yemen',                code: 'ye' },
    ],
  },
  {
    label: 'Africa',
    skins: [
      { id: 'cflag:ao',    label: 'Angola',                    code: 'ao' },
      { id: 'cflag:bf',    label: 'Burkina Faso',              code: 'bf' },
      { id: 'cflag:bi',    label: 'Burundi',                   code: 'bi' },
      { id: 'cflag:bj',    label: 'Benin',                     code: 'bj' },
      { id: 'cflag:bw',    label: 'Botswana',                  code: 'bw' },
      { id: 'cflag:cd',    label: 'Congo, DR',                 code: 'cd' },
      { id: 'cflag:cf',    label: 'Central African Republic',  code: 'cf' },
      { id: 'cflag:cg',    label: 'Congo',                     code: 'cg' },
      { id: 'cflag:ci',    label: 'Ivory Coast',               code: 'ci' },
      { id: 'cflag:cm',    label: 'Cameroon',                  code: 'cm' },
      { id: 'cflag:cv',    label: 'Cabo Verde',                code: 'cv' },
      { id: 'cflag:dj',    label: 'Djibouti',                  code: 'dj' },
      { id: 'cflag:dz',    label: 'Algeria',                   code: 'dz' },
      { id: 'cflag:eg',    label: 'Egypt',                     code: 'eg' },
      { id: 'cflag:eh',    label: 'Western Sahara',            code: 'eh' },
      { id: 'cflag:er',    label: 'Eritrea',                   code: 'er' },
      { id: 'cflag:et',    label: 'Ethiopia',                  code: 'et' },
      { id: 'cflag:et-af', label: 'Afar',                      code: 'et-af' },
      { id: 'cflag:et-am', label: 'Amhara',                    code: 'et-am' },
      { id: 'cflag:et-be', label: 'Benishangul-Gumuz',         code: 'et-be' },
      { id: 'cflag:et-ga', label: 'Gambela',                   code: 'et-ga' },
      { id: 'cflag:et-ha', label: 'Harari',                    code: 'et-ha' },
      { id: 'cflag:et-or', label: 'Oromia',                    code: 'et-or' },
      { id: 'cflag:et-si', label: 'Sidama',                    code: 'et-si' },
      { id: 'cflag:et-sn', label: 'Southern Nations',          code: 'et-sn' },
      { id: 'cflag:et-so', label: 'Somali',                    code: 'et-so' },
      { id: 'cflag:et-sw', label: 'South West Region',         code: 'et-sw' },
      { id: 'cflag:et-ti', label: 'Tigray',                    code: 'et-ti' },
      { id: 'cflag:ga',    label: 'Gabon',                     code: 'ga' },
      { id: 'cflag:gh',    label: 'Ghana',                     code: 'gh' },
      { id: 'cflag:gm',    label: 'Gambia',                    code: 'gm' },
      { id: 'cflag:gn',    label: 'Guinea',                    code: 'gn' },
      { id: 'cflag:gq',    label: 'Equatorial Guinea',         code: 'gq' },
      { id: 'cflag:gw',    label: 'Guinea-Bissau',             code: 'gw' },
      { id: 'cflag:ke',    label: 'Kenya',                     code: 'ke' },
      { id: 'cflag:km',    label: 'Comoros',                   code: 'km' },
      { id: 'cflag:lr',    label: 'Liberia',                   code: 'lr' },
      { id: 'cflag:ls',    label: 'Lesotho',                   code: 'ls' },
      { id: 'cflag:ly',    label: 'Libya',                     code: 'ly' },
      { id: 'cflag:ma',    label: 'Morocco',                   code: 'ma' },
      { id: 'cflag:mg',    label: 'Madagascar',                code: 'mg' },
      { id: 'cflag:ml',    label: 'Mali',                      code: 'ml' },
      { id: 'cflag:mr',    label: 'Mauritania',                code: 'mr' },
      { id: 'cflag:mu',    label: 'Mauritius',                 code: 'mu' },
      { id: 'cflag:mw',    label: 'Malawi',                    code: 'mw' },
      { id: 'cflag:mz',    label: 'Mozambique',                code: 'mz' },
      { id: 'cflag:na',    label: 'Namibia',                   code: 'na' },
      { id: 'cflag:ne',    label: 'Niger',                     code: 'ne' },
      { id: 'cflag:ng',    label: 'Nigeria',                   code: 'ng' },
      { id: 'cflag:re',    label: 'Réunion',                   code: 're' },
      { id: 'cflag:rw',    label: 'Rwanda',                    code: 'rw' },
      { id: 'cflag:sc',    label: 'Seychelles',                code: 'sc' },
      { id: 'cflag:sd',    label: 'Sudan',                     code: 'sd' },
      { id: 'cflag:sh-ac', label: 'Ascension Island',          code: 'sh-ac' },
      { id: 'cflag:sh-hl', label: 'Saint Helena',              code: 'sh-hl' },
      { id: 'cflag:sh-ta', label: 'Tristan da Cunha',          code: 'sh-ta' },
      { id: 'cflag:sl',    label: 'Sierra Leone',              code: 'sl' },
      { id: 'cflag:sn',    label: 'Senegal',                   code: 'sn' },
      { id: 'cflag:so',    label: 'Somalia',                   code: 'so' },
      { id: 'cflag:ss',    label: 'South Sudan',               code: 'ss' },
      { id: 'cflag:st',    label: 'São Tomé and Príncipe',     code: 'st' },
      { id: 'cflag:sz',    label: 'Eswatini',                  code: 'sz' },
      { id: 'cflag:td',    label: 'Chad',                      code: 'td' },
      { id: 'cflag:tg',    label: 'Togo',                      code: 'tg' },
      { id: 'cflag:tn',    label: 'Tunisia',                   code: 'tn' },
      { id: 'cflag:tz',    label: 'Tanzania',                  code: 'tz' },
      { id: 'cflag:ug',    label: 'Uganda',                    code: 'ug' },
      { id: 'cflag:yt',    label: 'Mayotte',                   code: 'yt' },
      { id: 'cflag:za',    label: 'South Africa',              code: 'za' },
      { id: 'cflag:zm',    label: 'Zambia',                    code: 'zm' },
      { id: 'cflag:zw',    label: 'Zimbabwe',                  code: 'zw' },
    ],
  },
  {
    label: 'Oceania',
    skins: [
      { id: 'cflag:as',    label: 'American Samoa',                        code: 'as' },
      { id: 'cflag:au',    label: 'Australia',                             code: 'au' },
      { id: 'cflag:au-act',label: 'Australian Capital Territory',          code: 'au-act' },
      { id: 'cflag:au-nsw',label: 'New South Wales',                       code: 'au-nsw' },
      { id: 'cflag:au-nt', label: 'Northern Territory',                    code: 'au-nt' },
      { id: 'cflag:au-qld',label: 'Queensland',                            code: 'au-qld' },
      { id: 'cflag:au-sa', label: 'South Australia',                       code: 'au-sa' },
      { id: 'cflag:au-tas',label: 'Tasmania',                              code: 'au-tas' },
      { id: 'cflag:au-vic',label: 'Victoria',                              code: 'au-vic' },
      { id: 'cflag:au-wa', label: 'Western Australia',                     code: 'au-wa' },
      { id: 'cflag:cc',    label: 'Cocos (Keeling) Islands',               code: 'cc' },
      { id: 'cflag:ck',    label: 'Cook Islands',                          code: 'ck' },
      { id: 'cflag:cx',    label: 'Christmas Island',                      code: 'cx' },
      { id: 'cflag:fj',    label: 'Fiji',                                  code: 'fj' },
      { id: 'cflag:fm',    label: 'Micronesia',                            code: 'fm' },
      { id: 'cflag:gu',    label: 'Guam',                                  code: 'gu' },
      { id: 'cflag:ki',    label: 'Kiribati',                              code: 'ki' },
      { id: 'cflag:mh',    label: 'Marshall Islands',                      code: 'mh' },
      { id: 'cflag:mp',    label: 'Northern Mariana Islands',              code: 'mp' },
      { id: 'cflag:nc',    label: 'New Caledonia',                         code: 'nc' },
      { id: 'cflag:nf',    label: 'Norfolk Island',                        code: 'nf' },
      { id: 'cflag:nr',    label: 'Nauru',                                 code: 'nr' },
      { id: 'cflag:nu',    label: 'Niue',                                  code: 'nu' },
      { id: 'cflag:nz',    label: 'New Zealand',                           code: 'nz' },
      { id: 'cflag:pf',    label: 'French Polynesia',                      code: 'pf' },
      { id: 'cflag:pg',    label: 'Papua New Guinea',                      code: 'pg' },
      { id: 'cflag:pn',    label: 'Pitcairn Islands',                      code: 'pn' },
      { id: 'cflag:pw',    label: 'Palau',                                 code: 'pw' },
      { id: 'cflag:sb',    label: 'Solomon Islands',                       code: 'sb' },
      { id: 'cflag:tk',    label: 'Tokelau',                               code: 'tk' },
      { id: 'cflag:to',    label: 'Tonga',                                 code: 'to' },
      { id: 'cflag:tv',    label: 'Tuvalu',                                code: 'tv' },
      { id: 'cflag:um',    label: 'US Minor Outlying Islands',             code: 'um' },
      { id: 'cflag:vu',    label: 'Vanuatu',                               code: 'vu' },
      { id: 'cflag:wf',    label: 'Wallis and Futuna',                     code: 'wf' },
      { id: 'cflag:ws',    label: 'Samoa',                                 code: 'ws' },
    ],
  },
  {
    label: 'Other',
    skins: [
      { id: 'cflag:aq',    label: 'Antarctica',                            code: 'aq' },
      { id: 'cflag:bv',    label: 'Bouvet Island',                         code: 'bv' },
      { id: 'cflag:gs',    label: 'South Georgia & South Sandwich Islands',code: 'gs' },
      { id: 'cflag:hm',    label: 'Heard Island and McDonald Islands',     code: 'hm' },
      { id: 'cflag:tf',    label: 'French Southern Territories',           code: 'tf' },
    ],
  },
]

// Derive ALL_CIRCLE_FLAGS from the canonical FLAGS list so skin lookups always work
export const ALL_CIRCLE_FLAGS = FLAGS.map(f => ({ id: `cflag:${f.code}`, label: f.name, code: f.code }))

// ── Image skins — drop matching .png files into public/skins/ ────────────────
export const IMAGE_SKIN_CATEGORIES = [
  {
    label: 'Faces',
    skins: [
      { id: 'img:happy',    label: 'Happy',    file: 'happy.png' },
      { id: 'img:cool',     label: 'Cool',     file: 'cool.png' },
      { id: 'img:angry',    label: 'Angry',    file: 'angry.png' },
      { id: 'img:silly',    label: 'Silly',    file: 'silly.png' },
      { id: 'img:wink',     label: 'Wink',     file: 'wink.png' },
      { id: 'img:love',     label: 'Love',     file: 'love.png' },
    ],
  },
  {
    label: 'Animals',
    skins: [
      { id: 'img:cat',      label: 'Cat',      file: 'cat.png' },
      { id: 'img:dog',      label: 'Dog',      file: 'dog.png' },
      { id: 'img:fox',      label: 'Fox',      file: 'fox.png' },
      { id: 'img:bear',     label: 'Bear',     file: 'bear.png' },
      { id: 'img:panda',    label: 'Panda',    file: 'panda.png' },
      { id: 'img:lion',     label: 'Lion',     file: 'lion.png' },
      { id: 'img:frog',     label: 'Frog',     file: 'frog.png' },
      { id: 'img:penguin',  label: 'Penguin',  file: 'penguin.png' },
      { id: 'img:unicorn',  label: 'Unicorn',  file: 'unicorn.png' },
      { id: 'img:shark',    label: 'Shark',    file: 'shark.png' },
    ],
  },
  {
    label: 'Icons',
    skins: [
      { id: 'img:star',      label: 'Star',      file: 'star.png' },
      { id: 'img:heart',     label: 'Heart',     file: 'heart.png' },
      { id: 'img:fire',      label: 'Fire',       file: 'fire.png' },
      { id: 'img:lightning', label: 'Lightning', file: 'lightning.png' },
      { id: 'img:skull',     label: 'Skull',     file: 'skull.png' },
      { id: 'img:crown',     label: 'Crown',     file: 'crown.png' },
      { id: 'img:diamond',   label: 'Diamond',   file: 'diamond.png' },
      { id: 'img:rocket',    label: 'Rocket',    file: 'rocket.png' },
    ],
  },
]

export const ALL_IMAGE_SKINS = IMAGE_SKIN_CATEGORIES.flatMap(c => c.skins)

// ── Component ─────────────────────────────────────────────────────────────────
export default function PlayerPanel({ players, activePlayerId, onSelect, onAdd, onUpdate, onRemove }) {
  const [search, setSearch] = useState('')

  const visible = search.trim()
    ? players.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : players

  return (
    <div className={`panel ${styles.panel}`}>
      <div className="panel-header">
        <h3>Players <span className={styles.playerCount}>({players.length})</span></h3>
        <button className="btn-icon" onClick={onAdd} title="Add player">+</button>
      </div>

      {players.length > 6 && (
        <div className={styles.searchWrap}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search players…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch('')}>✕</button>
          )}
        </div>
      )}

      <div className={`panel-body ${styles.list}`}>
        {visible.length === 0 && (
          <div className={styles.searchEmpty}>No players match "{search}"</div>
        )}
        {visible.map((player) => (
          <PlayerRow
            key={player.id}
            player={player}
            isActive={player.id === activePlayerId}
            onSelect={() => onSelect(player.id)}
            onUpdate={onUpdate}
            onRemove={onRemove}
            canRemove={players.length > 1}
          />
        ))}
      </div>
      <div className={styles.footer}>
        <span className={styles.hint}>Tap a player to set them active</span>
      </div>
    </div>
  )
}

function PlayerRow({ player, isActive, onSelect, onUpdate, onRemove, canRemove }) {
  const [showSkins, setShowSkins] = useState(false)
  const [skinTab, setSkinTab]     = useState('flags')
  const [flagSearch, setFlagSearch] = useState('')
  const [emojiPage, setEmojiPage]   = useState(0)
  const [ballSkins, setBallSkins]   = useState(_ballSkinsCache)

  const currentFlag  = ALL_CIRCLE_FLAGS.find(s => s.id === player.ballSkin) || null
  const currentImg   = ALL_IMAGE_SKINS.find(s => s.id === player.ballSkin) || null
  const currentEmoji = player.ballSkin?.startsWith('emoji:') ? player.ballSkin.replace('emoji:', '') : null

  const emojiPageCount = ballSkins ? Math.ceil(ballSkins.length / EMOJI_PAGE_SIZE) : 1
  const emojiRows = ballSkins ? ballSkins.slice(emojiPage * EMOJI_PAGE_SIZE, (emojiPage + 1) * EMOJI_PAGE_SIZE) : []

  const flagSearchResults = useMemo(() => {
    const q = flagSearch.trim().toLowerCase()
    if (!q) return null
    return FLAGS.filter(f => f.name.toLowerCase().includes(q))
  }, [flagSearch])

  return (
    <div
      className={`${styles.row} ${isActive ? styles.active : ''}`}
      onClick={onSelect}
    >
      {/* Ball preview */}
      <div
        className={styles.ballPreview}
        style={
          currentFlag
            ? { boxShadow: isActive ? `0 0 10px ${player.color}` : undefined }
            : currentEmoji
              ? { boxShadow: isActive ? `0 0 10px ${player.color}` : undefined }
              : {
                  background: `radial-gradient(circle at 35% 35%, ${lighten(player.color)}, ${player.color} 60%, ${darken(player.color)})`,
                  boxShadow: isActive ? `0 0 10px ${player.color}` : undefined,
                }
        }
      >
        {currentFlag && (
          <img src={`${CDN}/${currentFlag.code}.svg`} className={styles.flagOnBall} alt={currentFlag.label} />
        )}
        {!currentFlag && currentImg && (
          <img src={`/skins/${currentImg.file}`} className={styles.imgOnBall} alt="" onError={e => { e.currentTarget.style.display = 'none' }} />
        )}
        {!currentFlag && !currentImg && currentEmoji && (
          <img src={`/emojis/${currentEmoji}.svg`} className={styles.imgOnBall} alt="" />
        )}
      </div>

      {/* Name + score */}
      <div className={styles.details}>
        <input
          type="text"
          value={player.name}
          onChange={e => { e.stopPropagation(); onUpdate(player.id, 'name', e.target.value) }}
          onClick={e => e.stopPropagation()}
          className={styles.nameInput}
          placeholder="Player name"
        />
        <div className={styles.score}>
          <span className={styles.scoreValue} style={{ color: player.color }}>{player.score}</span>
          <span className={styles.scorePts}>pts</span>
        </div>
      </div>

      {/* Colour picker */}
      <input
        type="color"
        value={player.color}
        onChange={e => { e.stopPropagation(); onUpdate(player.id, 'color', e.target.value) }}
        onClick={e => e.stopPropagation()}
        title="Ball colour"
      />

      {/* Skin picker */}
      <div className={styles.skinWrap} onClick={e => e.stopPropagation()}>
        <button
          className={styles.skinBtn}
          onClick={e => { e.stopPropagation(); setShowSkins(v => !v) }}
          title="Ball skin"
        >
          {currentFlag
            ? <img src={`${CDN}/${currentFlag.code}.svg`} style={{ width: 16, height: 16, borderRadius: '50%' }} alt="" />
            : currentImg
              ? <img src={`/skins/${currentImg.file}`} style={{ width: 14, height: 14, objectFit: 'contain' }} alt="" onError={e => { e.currentTarget.style.display = 'none' }} />
              : currentEmoji
                ? <img src={`/emojis/${currentEmoji}.svg`} style={{ width: 16, height: 16, objectFit: 'contain' }} alt="" />
                : '🎱'
          }
        </button>

        {showSkins && (
          <div className={styles.skinDropdown}>
            {/* Tabs */}
            <div className={styles.skinTabs}>
              <button
                className={`${styles.skinTabBtn} ${skinTab === 'flags' ? styles.skinTabActive : ''}`}
                onClick={() => setSkinTab('flags')}
              >🏁 Flags</button>
              <button
                className={`${styles.skinTabBtn} ${skinTab === 'emojis' ? styles.skinTabActive : ''}`}
                onClick={() => { setSkinTab('emojis'); loadBallSkins().then(setBallSkins) }}
              >😀 Emoji</button>
            </div>

            {skinTab === 'flags' && (
              <div className={styles.flagSkinPanel}>
                {/* Search */}
                <div className={styles.flagSearchWrap}>
                  <input
                    className={styles.flagSearchInput}
                    type="text"
                    placeholder="Search flags…"
                    value={flagSearch}
                    onChange={e => setFlagSearch(e.target.value)}
                    onClick={e => e.stopPropagation()}
                  />
                  {flagSearch && (
                    <button className={styles.flagSearchClear} onClick={e => { e.stopPropagation(); setFlagSearch('') }}>✕</button>
                  )}
                </div>

                {/* No-flag option — inside a grid so it stays a small square cell */}
                <div className={styles.skinGrid} style={{ paddingBottom: 0 }}>
                  <button
                    className={`${styles.skinOption} ${!currentFlag ? styles.skinSelected : ''}`}
                    onClick={() => { onUpdate(player.id, 'ballSkin', ''); setShowSkins(false) }}
                    title="Solid colour (no skin)"
                  >
                    <span style={{ fontSize: 9, color: 'var(--text-secondary)' }}>●</span>
                  </button>
                </div>

                {flagSearchResults ? (
                  /* Flat search results */
                  flagSearchResults.length === 0
                    ? <div className={styles.flagSearchEmpty}>No flags found</div>
                    : <div className={styles.skinGrid}>
                        {flagSearchResults.map(f => {
                          const id = `cflag:${f.code}`
                          return (
                            <button
                              key={id}
                              className={`${styles.skinOption} ${player.ballSkin === id ? styles.skinSelected : ''}`}
                              onClick={() => { onUpdate(player.id, 'ballSkin', id); setShowSkins(false); setFlagSearch('') }}
                              title={f.name}
                            >
                              <img src={f.url} alt={f.name} className={styles.flagSkinPreview} />
                            </button>
                          )
                        })}
                      </div>
                ) : (
                  /* Category browse */
                  CIRCLE_FLAG_CATEGORIES.map(cat => (
                    <div key={cat.label} className={styles.flagCatSection}>
                      <div className={styles.imgCatLabel}>{cat.label}</div>
                      <div className={styles.skinGrid}>
                        {cat.skins.map(skin => (
                          <button
                            key={skin.id}
                            className={`${styles.skinOption} ${player.ballSkin === skin.id ? styles.skinSelected : ''}`}
                            onClick={() => { onUpdate(player.id, 'ballSkin', skin.id); setShowSkins(false) }}
                            title={skin.label}
                          >
                            <img src={`${CDN}/${skin.code}.svg`} alt={skin.label} className={styles.flagSkinPreview} />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}


            {skinTab === 'emojis' && (
              <div className={styles.emojiSkinPanel}>
                <div className={styles.skinGrid}>
                  {/* No-skin option */}
                  <button
                    className={`${styles.skinOption} ${!currentEmoji && !currentFlag && !currentImg ? styles.skinSelected : ''}`}
                    onClick={() => { onUpdate(player.id, 'ballSkin', ''); setShowSkins(false) }}
                    title="Solid colour"
                  >
                    <span style={{ fontSize: 9, color: 'var(--text-secondary)' }}>●</span>
                  </button>
                  {emojiRows.map(({ codepoint }) => {
                    const id   = `emoji:${codepoint}`
                    const char = cpToChar(codepoint)
                    return (
                      <button
                        key={id}
                        className={`${styles.skinOption} ${styles.emojiSkinOption} ${player.ballSkin === id ? styles.skinSelected : ''}`}
                        onClick={() => { onUpdate(player.id, 'ballSkin', id); setShowSkins(false) }}
                        title={codepoint}
                      >
                        {char || <img src={`/emojis/${codepoint}.svg`} style={{ width: 18, height: 18 }} alt="" />}
                      </button>
                    )
                  })}
                </div>
                <div className={styles.emojiPager}>
                  <button
                    className={styles.emojiPageBtn}
                    onClick={() => setEmojiPage(p => Math.max(0, p - 1))}
                    disabled={emojiPage === 0}
                  >‹</button>
                  <span className={styles.emojiPageInfo}>{emojiPage + 1} / {emojiPageCount}</span>
                  <button
                    className={styles.emojiPageBtn}
                    onClick={() => setEmojiPage(p => Math.min(emojiPageCount - 1, p + 1))}
                    disabled={emojiPage >= emojiPageCount - 1}
                  >›</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {canRemove && (
        <button
          className="btn-icon"
          onClick={e => { e.stopPropagation(); onRemove(player.id) }}
          title="Remove"
        >×</button>
      )}
      {isActive && <div className={styles.activeDot} />}
    </div>
  )
}

function lighten(hex) {
  const num = parseInt(hex.replace('#',''), 16)
  return `rgb(${Math.min(255,(num>>16)+60)},${Math.min(255,((num>>8)&0xff)+60)},${Math.min(255,(num&0xff)+60)})`
}
function darken(hex) {
  const num = parseInt(hex.replace('#',''), 16)
  return `rgb(${Math.max(0,(num>>16)-40)},${Math.max(0,((num>>8)&0xff)-40)},${Math.max(0,(num&0xff)-40)})`
}
