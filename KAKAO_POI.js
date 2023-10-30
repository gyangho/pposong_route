const axios = require('axios');
const convert = require('./convert_XY');

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, ".env") });

class Place{
  constructor(Name, Address, X, Y, Lat, Lon) {
    this.Name = Name;
    this.Address = Address;
    this.X = X;
    this.Y = Y;
    this.Lat = Lat;
    this.Lon = Lon;
  }
}

async function GetPOI(input) {
  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(input)}`;
  const config = {
    headers: {
      'Authorization': `KakaoAK ${process.env.KAKAO_REST_KEY}`,
    },
  };

  try {
    const response = await axios.get(url, config);
    if (response.status == 200) {
      const Places = [];
      response.data.documents.forEach(place => {
        const location = convert.dfs_xy_conv("toXY", place.y, place.x);
        const aPlace = new Place(place.place_name, place.address_name, location.x, location.y, location.lat, location.lon);
        Places.push(aPlace);
      });
      Places.forEach(p => {
        console.log(p);
      })
      return Places;
    }
    else {
      console.error(`HTTP 요청 실패, 상태 코드 : ${response.status}`);
    }
  } catch (err) {
    if (err.response) {
      console.error(`HTTP 요청 실패, 상태 코드 : ${response.status}`);
    } else if (err.request) {
      console.error(`네트워크 문제 : ${err.message}`);
    } else
      console.error(`오류 발생 : ${err.message}`);
  }
}

module.exports = {
  GetPOI: GetPOI
};