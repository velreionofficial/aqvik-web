import { test } from "node:test";
import assert from "node:assert/strict";

import { decryptAgile, decryptXlsx } from "./office-crypto.ts";

/**
 * Fixtures: a small made-up statement (.xlsx, 5892 bytes) locked two ways: by
 * LibreOffice ("standard" encryption, password test123) and by an independent
 * spec-based encryptor ("agile", SHA-1 / AES-128 like SBI's files, password Sbi@1234).
 */
/** LibreOffice saved its own copy of the statement, checked with openpyxl after decryption. */
const STANDARD_PLAIN_SHA256 = "0a0b08f908a222676c12b3d4837a097bf4e28390511c29ab1e9b0b64bee533c8";
const PLAIN_SHA256 = "9a9a3d82bd760add1645cd786532686dd613c9b2441997d2993854833efb131a";
const STANDARD_LOCKED =
  "0M8R4KGxGuEAAAAAAAAAAAAAAAAAAAAAOwADAP7/CQAGAAAAAAAAAAAAAAABAAAAEAAAAAAAAAAAEAAAAgAAAAEAAAD+////AAAA" +
  "AAAAAAD/////////////////////////////////////////////////////////////////////////////////////////////" +
  "////////////////////////////////////////////////////////////////////////////////////////////////////" +
  "////////////////////////////////////////////////////////////////////////////////////////////////////" +
  "////////////////////////////////////////////////////////////////////////////////////////////////////" +
  "////////////////////////////////////////////////////////////////////////////////////////////////////" +
  "///////////////////////////////////////////////////////////////////////////////////9//////////7////+" +
  "////BQAAAAYAAAAHAAAACAAAAAkAAAAKAAAACwAAAAwAAAANAAAADgAAAA8AAAD+/////v//////////////////////////////" +
  "////////////////////////////////////////////////////////////////////////////////////////////////////" +
  "////////////////////////////////////////////////////////////////////////////////////////////////////" +
  "////////////////////////////////////////////////////////////////////////////////////////////////////" +
  "////////////////////////////////////////////////////////////////////////////////////////////////////" +
  "////////////////////////////////////////////////////////////////////////////////////////////////////" +
  "/////////////////////////////////////////////////////////////////1IAbwBvAHQAIABFAG4AdAByAHkAAAAAAAAA" +
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWAAUA////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
  "AAAAAAAAAAAAAAAAAAAA/v///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
  "AAAAAAAAAAAAAAAAAAAAAAAAAAD///////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+////AAAA" +
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//" +
  "/////////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP7///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////////////////AAAAAAAAAAAAAAAA" +
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/v///wAAAAAAAAAAAQAAAAIAAAADAAAA/v//////////////////////////////////" +
  "////////////////////////////////////////////////////////////////////////////////////////////////////" +
  "////////////////////////////////////////////////////////////////////////////////////////////////////" +
  "////////////////////////////////////////////////////////////////////////////////////////////////////" +
  "////////////////////////////////////////////////////////////////////////////////////////////////////" +
  "////////////////////////////////////////////////////////////////////////////////////////////////////" +
  "////////////////////////////////////////////////////////////////////////////////////////////////////" +
  "//////////////////////////////8DAAIAJAAAAIwAAAAkAAAAAAAAAA5mAAAEgAAAgAAAABgAAAAAAAAAAAAAAE0AaQBjAHIA" +
  "bwBzAG8AZgB0ACAARQBuAGgAYQBuAGMAZQBkACAAUgBTAEEAIABhAG4AZAAgAEEARQBTACAAQwByAHkAcAB0AG8AZwByAGEAcABo" +
  "AGkAYwAgAFAAcgBvAHYAaQBkAGUAcgAAABAAAABv8NHEsNqzUqDBuAo6O+1JGCt7C8uHe/VF7Y8uoAqUoRQAAABLm4kzQhuIgToH" +
  "3fvCYq04KkVFg9OzzO+JQXWqMPCVxgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
  "AAAAAAAAAAAAAHQWAAAAAAAAv2wIPFxTGW/SHTANq3vt8LUh5hVoK1Agmuz+vzQwQbCKIDCW3Ld1xwBam2oWiPKuwkL2AIzHsZ2B" +
  "h6FNA6m5X08E6VOPj0SsXfGbFuJdVI9A43hqabSoVq/T04CiKGEai6yppIGSjMWiB7x0sp0Rj//huUKnAgCa9U88DcZQWwyULcD9" +
  "S7pXUpJxZv1s6h7b9wrBnRI4dc4tDUJOAErcZxxcmh325RZ5jhVlR+F65Oj+Iq8Vr4qzp2JvEZdun9Rk+mauLf9wG5gilgD4K/Q7" +
  "gwFzPxcTGxlqrKG3ir+cEm5/HdBPfQWtB9Les5XgsX9FtFc0YO0UHcHB+dpIS5F1NPX3r32f2owuoLlkgyzdzmzaczN4Phwei0ko" +
  "NZDoLhG+8nyjk133YmlbilKO09RY0YKo5caEOcE+PUKbeYlGtzZGQPwtIitZl4YM8gSeRdjBolaSF4yYGcuIRG2QUPPb3+GiJJzA" +
  "tXI72FRFqzYCU1fdJIL679ayfGLmLrk98NIub435f+1wEpYlXVCJFGrJxkdAh8V8Nzv27D9pEcSyqbQFSI/cS9vfjztSqV4/PSl6" +
  "aqLJdd9m82Pbv/E7TlfJLuAVWCbhqOAzmA8TGdXd2fOcrk2hSoaeUFPKwEeP+VmuxtgM/323G+dZm0DkLnkXMSSckosdwvDR3SO5" +
  "C3f0GkQlQuu6vD3LaOlQtAngHe19x0IxpiFrVE0SuqMirMaMf50Y7+3He2wQR3uvnPEBdv/HdvKvpb0g+GxPMw+WS8N8WEL48T+o" +
  "d6d/BXyxyPftjhJ2LXNbV3lp9sxutthS8e7qoNIkeAG7ATK8Z7715KhA3Foql0onq4tu/QSOrhd40HyLI0Lj1MiWZsp/wA+E/pfs" +
  "Ry/WAASMZPSRZDDqIZ540A1VxfZ8fqxiCVX8TXjYOcOP9E2JQZqMq6EdMZyYL33dmgikRjK1v37XX0lAhTkj1QTpGb4zvLNDjaGD" +
  "dGZtYv80nZd8RebxuPe4Svc65XXAnOy6QPbNBkbDlZWX40mKfKUPoY8H1/sjcNXi0SBdkT40zgQYLhqxLD6vOVwYvjbiFZC8iya6" +
  "JXA/5WnaI6Yn7dVuZMVBkmaIB2Hoc60hl564A1hNCLfnZ5Oo/WXvlGOWr5LBN0UkQqMU6VF2P2YNB4dAP1xCTxQYnMCWXBDCQGJu" +
  "nSPDGTTn8PWcbn2+zCUOhFV1O87AUht1UNqHyPUM0cBy9qsvQ7f0SdXvV6lhttxBaHn5SFBpVnqLTXvFMVzMRLZgJsTQBW9Lr3ph" +
  "Uo/4oQ0pCcDYx+GDvBZHvIIPxEEa4CGs8rf6ilkJqy7PHBfY6zBiO4LExTXU8scBhsEhIdEkK0ePbet3uAIc9alCVpu8iixcKY9r" +
  "jATFEcr5iKlbfIOPO8Ioo09x38BW/+8BClrDG5FWcY8m6k2rKRTB5QK7Bl5qPCSP/WihKpujgLf4PMjaHYWaT2PqpG77QywZeozS" +
  "ajNgzV2Hs6dHZpOFoNUktWMadrnilZLUC2GnnVyDEKpv6DvaKfWS5CJH77lfV7RJw7KSpnhrQUnxhHbjQdC2vWpbWMbIT67e2Qra" +
  "KS4xe7H9CuLr/uaX7Q+9gIMa9p96tmr2BijXxyV3/bdWky3ytKfacdrDg4b7dl9Hqy07vcPyK/kcCnE1hQByriBWtApKO5v7lE+z" +
  "5W0WmHjwApHaPSKkPRRZY0ZoGEPkhb7/13aykkw6ReMFnhV3qbCk2G5uq0RfZxTJrRG60k6YP8uiGx27rSuJ0wrmYlMF3auOUW0O" +
  "KeneE5aJLt9bvxqf5Y3aJpHsY8VR9VrIxSMB1utWO5iPWottEabsfKfriOygwv56syZBHE5/7mVrt/GuY0ym5tBLy/4zWAk7Eph0" +
  "n2Xju2W1YElXRghJm22a5ZKxf/9R0a8Lmd5m6yRCCRNfd1Kq190oCarYrpGJIUUBQWrIeUVRqVVbMnikdFT1vXcjk9HR4VdKdxtV" +
  "iIuEYTU0UtoSKoqtkEYqfAC94sy4pssKEWhpE2j9Padlx8foF/h1UH6c/ra/DB1rqb5KJxltl3C8BuTSYTN93XX0w0g62HXwC13X" +
  "q9xUAX/M3gPcvwYOlXHVdMMrChd94Q2jjP6wMsWnop05EixAaCHY0JxEP99kh4qZI8Facfig4lUZtjPySh7xmVBJS+nWDYNTeF6J" +
  "u7qZ3Nstk1t0MfJxCAYFSabvWg9d9jGGex2nKpdLQbOswgI/O/F53xpJq2i2SCj+P4ss1uvPBtIN0oG0nw0dmGdxuTueWWIymc5p" +
  "t3avWYGZGjK0I+T12qAL58k67xEbXVTbwcgdbmP7bLHgWbUnRQ8we83KIn4oyKpnacLT9wKdriZVgCQ4yoCSfw7Jxf+vUThOFLSl" +
  "PGMmV51MtjEHNA3MLIlvufQyVdIISqg49v3Pwm8+Q2tDZ1qYu0Ul9Us4j0y/GM/056TOZiuQ9VnkSj87AJO9tTiH3QdZvRYNqhmM" +
  "Rp9XNEdm34itL/vVhHsTo5pXy1P+fc3rqoWevWK9yz/B1tO1JsC4cKd20ZMTSIWCmc2VmZMZ4A6+gbh0OrQ4HRDkP0ICdB9IihCJ" +
  "NF5ND9FziTAKvg5hQJBRXDo9sbc6g4lRW0OAypPK85m61CqIrGdkKp2hSASApkBdcw5CYP07WM8r8YK7b925qW50exnDDz/cHnri" +
  "h4O5L6nmIMHjToAYFrapUZDphq0b7r5anmqcFl/BmVWQGeZ77wcOsiAKgyXCG59/YLF8Qp19YmMDsvdDKyDoA95UfeV5iFDIJHTM" +
  "I93KVAt71492tJK35r2rCZnvdEThtJGbfxPwOcVjq9oKQU+YlvOBsipiPT1KM2hVNMHTnY/KEiJludiDhJRCRR3JIzHXJS6rakN6" +
  "kn5sULpv57gxlMBGCq587PcEbMxGS4R+Y+NjQKE3L8HxXYlZHpdfmqKwMRL1q7FI9ur4+JcuJvoQ9gUin9ur2gVmI6CkR3LMT131" +
  "BJFUuLXFHavAqpd4oeV173RddRfpserlhjJqV1PEwe243nq6H+DvMoYFh/RQaqhaQip3JgZbNSHE5rQm6rGs03j6WIojHHuZcfYH" +
  "Yvq7oj5EekUYlN6aaVvo5SJb9rfFBW9BbAwxldWKhDYy/3VwRg9/Hm3o0RgGM0c8NHhtKIL7Y05MmHa1zYJqgmb8naFad8Sh9NDi" +
  "Ws72XCQcYbq17zFLjVvS/v4ZLbyM+qG5r6NAkgDkCY0wA7UK3SMV2AcJi1kIXEr636wESd9RVkkEkpNC1idgAsC6clAknSXgAJCM" +
  "q4K5LckqNHAEipD8JJhNGDPi2cD9nvUNBLbSjv02EkGE/paR5Y8CSzqjGZfHF6Nc8awwu3y5jsx/6gdeL5EE/xlqbm5OjLpsyw9p" +
  "MYbwNZCxWkH9umo1SO9cHBgrC8XlIQI1Er45DudpB8HFabw8kOllxGNJKcWralb2oJ3g/wPI80BWwKFm2CXY8ggtk7dVRGkXzRJQ" +
  "h9oEnFhwFoVEnHmyGwwEf15KFIk+YFzwm5v0kM+4FbGnqxd9KdaIWl8PJOzz1p5/x9S6O9QybrPnAJHyGDt5EonEdQekkPRnV1M5" +
  "DKbWBPHlUO+TnD8j4sw/GDI/BneeKpOaFQybL5/LKe+sTrAptr0uKWVMJAAZFEni9uJcR5aU/vnqfTtNLuvFY72fGy1GduhJHy7s" +
  "eMwacd1gRqS4gguoMjAEhaYo9Nc34sN+KsWgVQs4T/BWVrqB53UvHQg7eNWUH/1LJxuuEsb1VSMUBCpfKTnBPs36OIJZYDcHtROq" +
  "YVdmFSFcAvzTiXIsVJV8o3BeFt1HoQv14BxBX+U68OSWUQ61L8XbDCLZa6V0teAcNE/9PCGyu8pRVTLcz5gT9KQzOXHuT1j6YPaD" +
  "QtairEQz3Ue63CWQE2+3S9m6lphx87XILxOEbNpVJg0xHyGFOpbL5MTo6DDuIqlCHAMrYkLkOo0HNPdp7vFTbOu5vmWjAjdl/mwz" +
  "eFHW6fcWp2hPIXEvlGQz5y5ZIVThp9bTkNeCsVD2DEvWy4RElSBzvm062P57XGbvDBKqesktVyq2OH5O1lzx8qv8nKU3cXRtY7Li" +
  "8oOMNT8mNcSSKqoY/qhcl7Yx5YLC1Gx5aX1JL/4rPn/piUpkiFI42X7D9kTtw/2QSl0tT9PNDogy2fCJpesWpvsm3UUh1T1KG8MK" +
  "mzzGjABohHOtjbYHb/LTLPRHUk83nsECYqlSmhAZrRBVKqhCaty7XLNalYuenJ+g1JSOMM3qyiOP2nXm1iZWGD2hf0rioHjKR9PD" +
  "4ABrd78dAbW9kueWYzQEL0jHkLwFWfDsEdiIq6K1mbV6LTLeZURKsHOOJCWmD3bnnagsEBvIUXSc2WB82CJZCgG25p27Xc/IfNkg" +
  "CXxlRSGb6sE7I5XCB3/pP6GGsMwoxuKJ2c8pj+yYs66BjlJ8bp56Q3DiNixlEW9NMII7VQI03alaR8JnbMnnOLF+QiwelmBhFAsQ" +
  "wxmeWPgldNeValv3GnoC9wN1np1if7lkhGHRW0n0lCsV8HCXTmvQIC9+S9r1LzIunbcCAuH7i/f7Y3rMzvLoy4x5cjC5FhYLO7ag" +
  "zg1Na3UOZ3JxCQGr1GilYtrksE4vO5JU5CmlGb/d1Drq6g+4PxCRAsgkkVGPy6+1XW27vJaoe7+h2+0CFPv3WTVtvhYLP6QGIKvM" +
  "xDtmRNdiRJ/c9ML6gSl61LWIWR3Y6NNbjjUciBovBL82JbhjI8rcj2mUehn6LOjULzkbkAF83VpJTZMrkgFabVC3cFvpmvjwt/MD" +
  "i5zBFhdgRmde6QN3MCHyrtMf9cWt7OFEm/GecC4rNnBQbU86bSvVtUbC3zWsK/TLokCJ5N92GSKHBpU90HXffTE47W666zB71iqb" +
  "j3HXEJoHqegqFqNFEZNcb47HPK9aj1DeMlwEd97zhhr8vPSlsa42rk8zlBDmCKz2PEdb8LDkdFubR3u7b05zmpXxrLmB75BrjDQC" +
  "hcQMNGfnLCg0qqckc79RasLSkRln8H4QMD56HWPhwizeEZN4/vEqAXUL/K6YKJNI+MNqXV9Yk7iLc6Vu/nq85/CwxDqTrnmQeqMw" +
  "sDEZm4fKptKj3V3SM5hoLtgKUzCwBtRAj5YU6WOdgceBag7LsP4wbFcVSD5ZFs3xLGcwNk8j7IAII/y/rb7oPwfhZGSIVlGSVHlR" +
  "AqAmns9jVYozsiL81brE7cOiP05Bs+L0luc082kmvGyF/fNG01qAWsQCB2oUkdxLxQLq3AcFBdVf3Kw6Ttk26pRN6/CFzCKBg/mg" +
  "BiFkQOmCR7SOX++jRfLAF9B+RxolOYeneJZXHGTiPdhz7PHlp+2GNAsr17DFtmr6rZpXE2qnhHKzESetHKUoHBHdI0mjSxQrGr9K" +
  "Pn0kJCaMhoM+qYds1J+6am1xZpkPxq17ULAVZ8eGA8CQm/9WBwHWDxkjMlMSMAskXkaylVWsE5LvSXEP3nqBx+K8abLoYV1szPPk" +
  "F03C/butzUVHsIEei+gZsh27e3z5vZvcDFL/v8MxE1zu0Mp5crffe5T/65PAN0LfKb3ERS3eZ64QrSX3QO7RCyRMZb1Puqj3WUCY" +
  "Eww2tstwUFWaZ0pez4tqh2QKuhmgDJFmp94ZtWsaklPoE4EU0YLmx1VNx2QU8lhvCeX6suhkmm6uSaYWlqf5TrxaaSX2cMGAn7Qp" +
  "TOcqCmc3rJwQK/nRINu1B3Xjxd6CjOjlppUeCU1oz8XTxpSCRlXMPzVIpxFmqRrWkAz4EAp3H1ZaPm4N8D3jsAfUpNsZEofo3tkP" +
  "IXqg8X7vV6ZKeuvBX1+PyUNul1qfhIfbIOkSRb2DpUFx8PBn/0L1sdVyNlZtWVwZLT3UwY+OOAOp/u0HQkIqyTVKMG7p+7vAS2CO" +
  "60T6hDGoFwG2tDTVqUIbsX4zeN7RIDvJTwob3JXNwqIdiGeTFbKN1vDomWe4dDovrQUccQ+tiECOXG226m2+UvKl1BfnV40E551C" +
  "vTgKONt0xS6qonjlFCkv0hPqNIvYwPbQyPXZG5tHiBbR+kYBmGmNI1SznwRg1KFD8F5CWuX5gX8/fj0A7OxkBbQVL3ifNt5mEJmb" +
  "5gWRV1ikHxNAz5Yz5V7XUyzcIQB55geq+c9EsvNicmUVjfOtYpVOnUBQbCjy4a6MkjEsQzAYd0nGqvLEBFsRLcqHAUrk96w/ybjL" +
  "wi+2cnggx0yuwAD6pB9v+ZglMXtQ4IhapUhH5Co8Du7sVeaO4A6meoWX9YwUJ3/ysCcBWAXMUDrqx3qD2jVFySPwJdZchskkExsD" +
  "PKA71Hxp2GDrc1E6Gje/vzLPUwsa2nU8mbAcZfwuDa0BdjH74o2Znxbm5XnS0VjfvXfEbW3zMxTFxt6FHxcGg4xIMxxmxskxwwJK" +
  "HMgq6+iHDug3C2De3va1ilwGLzwdVfenW8ncUV5nE3UrpnNplU23pZcktxPE648eev55BxdW84rpQb60CVuD6UkIa2KGAHlPH/GX" +
  "CJ7FfqhHjQMbw0LpAxI5RcjIOQLoWNC6A+ldBnqsyyZyb8FmXwDXHtf92gDVCc0bWzbdFWKa6sXrJ8Clt7g5vU5nOSTFA+nCaTpo" +
  "0N32ZWt66bV6ndnOQJrX574oao4K7w7ebNrNbQ7ws/pyjn9MTP4Bkg7WHpTP1PBcfmot5Ac81CQudl5758A/MFJ9kIINiHN3wYAK" +
  "pHqoVf2t0KRSVHowvj2gWl30W6Uo+jaiUciXETXCQph/oNs6fq0f4kTaz/vBKChgSI1ZQWoNc9bIpyoTa67bfKsR1zXA91t7YCXf" +
  "/gbVNG70CM9UjG3KLijmOxgpkDcO+tL5RO8QNZo4At7VAoys8esvViQ46zoRbt990MOWgsCiy+7sAr5eIwhmQr6MEA0cvXLTHw9h" +
  "gStqVy68UUwpL67yfKOTXfdiaVuKUo7T1FjRevqgjDvhlLUO+PYixk2wamVj7nWJLaKPGKEoFVyYsgPJkmOYjxAivPVvi9Vpl9Sm" +
  "iG/g1pB+U52n8kdryRyE6kK+mIaxrZWLPbBgvGorfiXo/rq/RuEZ+zQmN4bqKz5WAX1AEvXO3CMJg1p30+1FOSM8gAtDgihzP4eH" +
  "HxtmPGcniK7QUuaFOJoh1THb+UEvslTQ3iemL6PJw/4TEox8306v8SpnN2XxK/lqyE88koTigWWwi+DzSUkvZy5f6J302ds3SBel" +
  "FWwF1cM1w+bCfNumG0MvGSJZwmYu187AZbrZ5af2sa2sckYfbpHReyOiYIoQkSDQ3Pgyh9P316BByS9Rk5oUYLcAXu83Wd6HinTg" +
  "8zss1Avc0fL06G2Bwm6bO3HZPpY9YW8ZEWGYiKL3grJecg47j1/qkF17GI3xHrdvja6/HK+Pe00eFI59HTySUWxrkWCst0oqiIJ3" +
  "TyKVRAFyOuwf4ZHZHRxA7CjOd39vxccSVmtV743paUdbe/7cdAk6U7xFF6SbnHaC5ilP5zNQB4ohiMD8nH87fkdcN5kXZAP4TlUF" +
  "Zb4Ev1DkzkmuS1eM25yt806VN50pUpSueTgqyOV8CWeKvYbWh2/OYc+ArtwSDI7XPKtZ68ssuTbWF8ADCTt7w+BsmhyW7uV2+l+h" +
  "vyD64S04Ax9We1mjUkB7s8vF0v8Nj4R3vFHNmS5PM9lZL6m4SHFBW74io/L0prwImmPrksl5Vx/69RkFekQuAO9LvrwrBgVC8Xr3" +
  "6YaKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
  "AAAAAFIAbwBvAHQAIABFAG4AdAByAHkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWAAUA////" +
  "//////8BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAABAAAAAAAARQBuAGMAcgB5AHAAdABpAG8A" +
  "bgBJAG4AZgBvAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4AAgD/////AgAAAP////8AAAAAAAAAAAAAAAAA" +
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAABFAG4AYwByAHkAcAB0AGUAZABQAGEAYwBrAGEAZwBlAAAAAAAAAAAA" +
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIgACAP///////////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
  "AAQAAACIFgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
  "AAAAAAAA////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/v///wAAAAAAAAAA";
const AGILE_INFO =
  "BAAEAEAAAAA8P3htbCB2ZXJzaW9uPSIxLjAiIGVuY29kaW5nPSJVVEYtOCIgc3RhbmRhbG9uZT0ieWVzIj8+PGVuY3J5cHRpb24g" +
  "eG1sbnM9Imh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vb2ZmaWNlLzIwMDYvZW5jcnlwdGlvbiIgeG1sbnM6cD0iaHR0cDov" +
  "L3NjaGVtYXMubWljcm9zb2Z0LmNvbS9vZmZpY2UvMjAwNi9rZXlFbmNyeXB0b3IvcGFzc3dvcmQiPjxrZXlEYXRhIHNhbHRTaXpl" +
  "PSIxNiIgYmxvY2tTaXplPSIxNiIga2V5Qml0cz0iMTI4IiBoYXNoU2l6ZT0iMjAiIGNpcGhlckFsZ29yaXRobT0iQUVTIiBjaXBo" +
  "ZXJDaGFpbmluZz0iQ2hhaW5pbmdNb2RlQ0JDIiBoYXNoQWxnb3JpdGhtPSJTSEExIiBzYWx0VmFsdWU9IjR5RUVBQUsyYWRpbEhB" +
  "SkxiMFRlQ2c9PSIvPjxrZXlFbmNyeXB0b3JzPjxrZXlFbmNyeXB0b3IgdXJpPSJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29t" +
  "L29mZmljZS8yMDA2L2tleUVuY3J5cHRvci9wYXNzd29yZCI+PHA6ZW5jcnlwdGVkS2V5IHNwaW5Db3VudD0iMTAwMDAwIiBzYWx0" +
  "U2l6ZT0iMTYiIGJsb2NrU2l6ZT0iMTYiIGtleUJpdHM9IjEyOCIgaGFzaFNpemU9IjIwIiBjaXBoZXJBbGdvcml0aG09IkFFUyIg" +
  "Y2lwaGVyQ2hhaW5pbmc9IkNoYWluaW5nTW9kZUNCQyIgaGFzaEFsZ29yaXRobT0iU0hBMSIgc2FsdFZhbHVlPSJXQVhCMm80d2lJ" +
  "YnFwRkorNHFGeXJ3PT0iIGVuY3J5cHRlZFZlcmlmaWVySGFzaElucHV0PSJNTlJLODFIV29OUkozUlJhaGVnWk1BPT0iIGVuY3J5" +
  "cHRlZFZlcmlmaWVySGFzaFZhbHVlPSJjT28xcG1abXpnN05LN0NSSWl0V2xuVXZPaGxuOHFoWVZhT1ZZYld6Y1QwPSIgZW5jcnlw" +
  "dGVkS2V5VmFsdWU9InhZZDB0dGZYblQ3MzVuLytueXd5YlE9PSIvPjwva2V5RW5jcnlwdG9yPjwva2V5RW5jcnlwdG9ycz48L2Vu" +
  "Y3J5cHRpb24+";
const AGILE_PACKAGE =
  "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";

const bytes = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const sha256 = async (b: Uint8Array) => Buffer.from(await crypto.subtle.digest("SHA-256", b as BufferSource)).toString("hex");

test("Locked Excel, standard encryption: wrong password refused, right one restores the exact file", async () => {
  const locked = bytes(STANDARD_LOCKED);
  assert.deepEqual(await decryptXlsx(locked, "nope"), { ok: false, reason: "wrong-password" });
  const r = await decryptXlsx(locked, "test123");
  assert.ok(r.ok);
  if (r.ok) assert.equal(await sha256(r.xlsx), STANDARD_PLAIN_SHA256);
});

test("Locked Excel, agile encryption (SBI style): wrong password refused, right one restores the exact file", async () => {
  const info = bytes(AGILE_INFO);
  const pkg = bytes(AGILE_PACKAGE);
  assert.deepEqual(await decryptAgile(info, pkg, "Sbi@123"), { ok: false, reason: "wrong-password" });
  const r = await decryptAgile(info, pkg, "Sbi@1234");
  assert.ok(r.ok);
  if (r.ok) assert.equal(await sha256(r.xlsx), PLAIN_SHA256);
});
