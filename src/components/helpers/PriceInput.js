import React, { Component } from 'react';

import { Form, Input, Select, Button } from 'antd';

const { Option } = Select;

class PriceInput extends React.Component {
  static getDerivedStateFromProps(nextProps) {
    // Should be a controlled component.
    if ('value' in nextProps) {
      return {
        ...(nextProps.value || {}),
      };
    }
    return null;
}

    constructor(props) {
        super(props);

        const value = props.value || {};
        this.state = {
            number: value.number || 0
        };
    }

    handleNumberChange = e => {
        const number = parseInt(e.target.value || 0, 10);
        if (Number.isNaN(number)) {
            return;
        }
        if (!('value' in this.props)) {
            this.setState({ number });
        }
        this.triggerChange({ number });
    }

    triggerChange = changedValue => {
        // Should provide an event to pass value to Form.
        const { onChange } = this.props;
        if (onChange) {
            onChange(Object.assign({}, this.state, changedValue));
        }
    };

    render() {
        const { size } = this.props;
        const { state } = this;
        return (
            <span>
            <Input
                type="text"
                size={size}
                value={state.number}
                onChange={this.handleNumberChange}
                style={{ width: '100%'}}
            />
            </span>
        );
    }
}

export default PriceInput;