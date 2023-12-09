import { GetPOI } from '../js/mainFunc.js';

function initAutocomplete(inputElement, latitude, longitude) {
    $(inputElement).autocomplete({
        source: async function (request, response) {
            const places = await GetPOI(request.term);
            const placesData = places.map(place => ({
                label: place.Name,
                value: place.Name,
                name: place.Name,
                address: place.Address,
                lat: place.Lat,
                lon: place.Lon
            }));
            response(placesData);
        },
        open: function (event, ui) {
            const menu = $(this).autocomplete('widget');
            const maxHeight = 400;
            const fieldWidth = $(this).outerWidth();
            menu.width(fieldWidth);
            menu.css('max-height', maxHeight + 'px');
            menu.css('overflow-y', 'auto');
            menu.css('overflow-x', 'hidden');
        },
        select: function (event, ui) {
            console.log(ui.item.name);
            console.log(ui.item.address);
            latitude.value = ui.item.lat;
            longitude.value = ui.item.lon;
        },
        focus: function (event, ui) {
            return false;
        },
        minLength: 1,
        delay: 50,
        close: function (event, ui) {
            console.log(event);
        },
    }).autocomplete("instance")._renderItem = function (ul, item) {
        return $("<li>")
            .append(`<div class="address"><div class="address-name">${item.name}<div>
                <span class="address-detail">${item.address}</span><br></div>`)
            .appendTo(ul);
    };
}

const inputField = document.getElementById('start-field');
const inputField2 = document.getElementById('end-field');
const startLatField = document.getElementById('start-lat');
const startLonField = document.getElementById('start-lon');
const endLatField = document.getElementById('end-lat');
const endLonField = document.getElementById('end-lon');
initAutocomplete(inputField, startLatField, startLonField);
initAutocomplete(inputField2, endLatField, endLonField);