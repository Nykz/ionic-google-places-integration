import { CommonModule } from '@angular/common';
import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { BehaviorSubject, Subscription } from 'rxjs';

declare var google;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class HomePage implements OnInit, OnDestroy {

  places: any[] = [];
  query: string;
  placesSub: Subscription;
  private _places = new BehaviorSubject<any[]>([]);

  get search_places() {
    return this._places.asObservable();
  }

  constructor(private zone: NgZone) {}

  ngOnInit(): void {
      this.placesSub = this.search_places.subscribe({
        next: (places) => {
          this.places = places;
        },
        error: (e) => {
          console.log(e);
        }
      });
  }

  async onSearchChange(event: any) {
    console.log(event);
    this.query = event.detail.value;
    if(this.query.length > 0) await this.getPlaces();
  }

  async getPlaces() {
    try {
      let service = new google.maps.places.AutocompleteService();
      service.getPlacePredictions({
        input: this.query,
        // componentRestrictions: {
        //   country: 'IN'
        // }
      }, (predictions) => {
        let autoCompleteItems = [];
        this.zone.run(() => {
          if(predictions != null) {
            predictions.forEach(async(prediction) => {
              console.log('prediction: ', prediction);
              let latLng: any = await this.geoCode(prediction.description);
              const places = {
                title: prediction.structured_formatting.main_text,
                address: prediction.description,
                lat: latLng.lat,
                lng: latLng.lng
              };
              console.log('places: ', places);
              autoCompleteItems.push(places);
            });
            // this.places = autoCompleteItems;
            // console.log('final places', this.places);
            // rxjs behaviorSubject
            this._places.next(autoCompleteItems);
          }
        });
      });
    } catch(e) {
      console.log(e);
    }
  }

  geoCode(address) {
    let latlng = {lat: '', lng: ''};
    return new Promise((resolve, reject) => {
      let geocoder = new google.maps.Geocoder();
      geocoder.geocode({'address' : address}, (results) => {
        console.log('results: ', results);
        latlng.lat = results[0].geometry.location.lat();
        latlng.lng = results[0].geometry.location.lng();
        resolve(latlng);
      });
    });
  }

  ngOnDestroy(): void {
      if(this.placesSub) this.placesSub.unsubscribe();
  }

}
