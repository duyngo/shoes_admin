import React, { Component } from 'react';
import PlacesAutocomplete, {
  geocodeByAddress,
  getLatLng,
} from 'react-places-autocomplete';
 
export class AutoComplete extends Component {
  constructor(props) {
    super(props);
    this.state = { address: '' };
  }
 
  handleChange = address => {

    this.setState({ address });
  };
 
  handleSelect = async address => {

    let result;

    await geocodeByAddress(address)
      .then(results => {
        const addressComponents = results[0].address_components;
        const lat = results[0].geometry.location.lat();
        const lng = results[0].geometry.location.lng();
        const address = results[0].formatted_address;

        result = results[0];
        this.props.setAddressFromAutocomplete(lng, lat, address, addressComponents)
      })
      .then(latLng => {
        this.setState({
          address : ''
        })
      })
      .catch(error => console.error('Error', error));
  };
 
  render() {

    const { customSearchOptions } = this.props;
    const { pickedAddress } = this.state;

    return (

      <PlacesAutocomplete
        value={this.state.address}
        onChange={this.handleChange}
        onSelect={this.handleSelect}
        searchOptions={customSearchOptions}
        debounce={1000}
      >
        {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
          <div>
            <input
            style={{ width: "100%", height: "30px"}}
              {...getInputProps({
                placeholder: 'Search Places ...',
                className: 'location-search-input form-control',
                id : 'autocompleteMap',
                ref : 'autocompleteMap',
              })}
            />
            <div className="autocomplete-dropdown-container">
              {loading && <div>Loading...</div>}
              {suggestions.map(suggestion => {
                const className = suggestion.active
                  ? 'suggestion-item--active'
                  : 'suggestion-item';
                // inline style for demonstration purpose
                const style = suggestion.active
                  ? { backgroundColor: '#fafafa', cursor: 'pointer' }
                  : { backgroundColor: '#ffffff', cursor: 'pointer' };
                return (
                  <div
                    {...getSuggestionItemProps(suggestion, {
                      className,
                      style,
                    })}
                  >
                    <span>{suggestion.description}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </PlacesAutocomplete>
    );
  }
}

export default AutoComplete;