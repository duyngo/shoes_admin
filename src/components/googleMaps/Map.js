import React, { Component } from 'react'
import { withGoogleMap, GoogleMap, withScriptjs, InfoWindow, Marker } from "react-google-maps";
import Geocode from "react-geocode";
import Autocomplete from 'react-google-autocomplete';

Geocode.setApiKey("AIzaSyCdpvUgaSmIUmvxIOtOMuubZmVoaEQhwa4");
Geocode.enableDebug();

class Map extends Component {

    constructor(props){
        super(props);

        this.state = {
            address : '',
            mapPosition : {
                lat : this.props.center.lat,
                lng : this.props.center.lng
            },
            markerPosition : {
                lat : this.props.center.lat,
                lng : this.props.center.lng
            }
        }
    }

    async componentDidMount(){
        const { mapPosition } = this.state;

        await Geocode.fromLatLng( mapPosition.lat, mapPosition.lng )
            .then( response => {
    
                const address = response.results[0].formatted_address;
                const addressComponents = response.results[0].address_components;
                this.setState({
                    address : (address) ? address : ''
                })

                this.props.setAddressFromMap( mapPosition.lng, mapPosition.lat, address , addressComponents);
            }, error => {
                console.log(error)
            })
    }

    componentDidUpdate( nextProps, nextState ){
        
        if( this.state.markerPosition.lat !== this.props.center.lat ){
            return true;
        }else if( this.props.isDraggable !== nextProps.isDraggable){
            return true;
        }else if( this.props.center.lat === nextProps.center.lat ){
            return false;
        }
    }

    shouldComponentUpdate(nextProps, nextState){
        
        if( this.state.markerPosition.lat !== this.props.center.lat ){
            return true;
        }else if( this.props.isDraggable !== nextProps.isDraggable){
            return true;
        }else if( this.props.center.lat === nextProps.center.lat ){
            return false;
        }
    }

    onChange = event => {
        this.setState({
            [event.target.name] : event.target.value
        })
    }

    onMarkerDragEnd = event => {
        let newLat  = event.latLng.lat(),
            newLng  = event.latLng.lng();

        Geocode.fromLatLng( newLat, newLng ).then( 
            response => {
                const address = response.results[0].formatted_address;
                const addressComponents = response.results[0].address_components;

                this.setState({
                    address : ( address ) ? address : '',
                    markerPosition : {
                        lat : newLat,
                        lng : newLng
                    },
                    mapPosition : {
                        lat : newLat,
                        lng : newLng
                    } 
                })

                this.props.setAddressFromMap( newLng, newLat, address , addressComponents);
            },
            error => {
                console.log(error);
            }
        )
    }

    onPlaceSelected = place => {
        const address = place.formatted_address,
              latValue = place.geometry.location.lat(),
              lngValue = place.geometry.location.lng(),
              addressComponents = place.address_components;

        this.setState({
            address : ( address ) ? address : '',
            markerPosition : {
                lat : latValue,
                lng : lngValue
            },
            mapPosition : {
                lat : latValue,
                lng : lngValue
            }
        })

        this.props.setAddressFromMap( lngValue ,latValue, address, addressComponents );

    }

    render(){

        const { mapPosition, markerPosition } = this.state;
        const { displayType, showAutoComplete } = this.props;
       
        const AsyncMap = withScriptjs(
            withGoogleMap(
                props => (
                    <GoogleMap
                        google={this.props.google}
                        defaultZoom={this.props.zoom}
                        defaultCenter={{ lat: mapPosition.lat , lng : mapPosition.lng }}
                    >
                        {
                            showAutoComplete &&
                            <Autocomplete
                                style={{
                                    width: '100%',
                                    height: '40px',
                                    paddingLeft: '16px',
                                    marginTop: '2px',
                                }}
                                onPlaceSelected={ this.onPlaceSelected }
                                types={[displayType]}
                            />
                        }
                        
                        <InfoWindow
                            position={{ lat : markerPosition.lat + 0.0018, lng : markerPosition.lng }}
                        >
                            <div>
								<span style={{ padding: 0, margin: 0 }}>{ this.state.address }</span>
							</div>
                        </InfoWindow>

                        <Marker google={this.props.google}
						        name={'Dolores park'}
						        draggable={ this.props.isDraggable }
						        onDragEnd={ this.onMarkerDragEnd }
						        position={{ lat: markerPosition.lat, lng: markerPosition.lng }}
						/>
						<Marker />
                        
                    </GoogleMap>
                )
            )
        )

        let map;

        if( this.props.center.lat !== undefined ){

            map = 
            <div>
                <AsyncMap
                    googleMapURL="https://maps.googleapis.com/maps/api/js?key=AIzaSyCdpvUgaSmIUmvxIOtOMuubZmVoaEQhwa4&libraries=places"
                    loadingElement={
                        <div style={{ height: `100%` }} />
                    }
                    containerElement={
                        <div style={{ height: this.props.height }} />
                    }
                    mapElement={
                        <div style={{ height: `100%` }} />
                    }
                />
                <div className="clearfix"></div>
            </div>
            
        }else{
            map = <div style={{ height: this.props.height }}></div>
        }

        return map;

    }

}

export default Map;