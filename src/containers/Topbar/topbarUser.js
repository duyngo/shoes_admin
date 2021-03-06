import React, { Component } from "react";
import { connect } from "react-redux";
import Popover from "../../components/uielements/popover";
import IntlMessages from "../../components/utility/intlMessages";
import authAction from "../../redux/auth/actions";
import TopbarDropdownWrapper from "./topbarDropdown.style";
import { Icon } from "antd";
import Button from '../../components/uielements/button';

const { logout } = authAction;

class TopbarUser extends Component {
  constructor(props) {
    super(props);
    this.handleVisibleChange = this.handleVisibleChange.bind(this);
    this.hide = this.hide.bind(this);
    this.state = {
      visible: false,
    };
  }
  hide() {
    this.setState({ visible: false });
  }
  handleVisibleChange() {
    this.setState({ visible: !this.state.visible });
  }

  handleLogout = () => {
    const { logout } = this.props;
    logout();
  }

  render() {
    const content = (
      <TopbarDropdownWrapper className="isoUserDropdown">
        {/* <a className="isoDropdownLink" href="# ">
          <IntlMessages id="themeSwitcher.settings" />
        </a>
        <a className="isoDropdownLink" href="# ">
          <IntlMessages id="sidebar.feedback" />
        </a>
        <a className="isoDropdownLink" href="# ">
          <IntlMessages id="topbar.help" />
        </a> */}
        <a className="isoDropdownLink" onClick={this.handleLogout} href="javascript:void(0)">
          <IntlMessages id="topbar.logout" />
        </a>
      </TopbarDropdownWrapper>
    );

    return (
      <Popover
        content={content}
        trigger="click"
        visible={this.state.visible}
        onVisibleChange={this.handleVisibleChange}
        arrowPointAtCenter={true}
        placement="bottomLeft"
      >
        <div className="isoImgWrapper">
          <Icon type="user" />
          <span className="userActivity online" />
        </div>
      </Popover>
    );
  }
}
export default connect(
  null,
  { logout }
)(TopbarUser);
