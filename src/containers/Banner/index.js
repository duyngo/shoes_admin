import React, { Component } from "react";
import { connect } from "react-redux";
import _ from "lodash";
import calculateAspectRatio from "calculate-aspect-ratio";

import {
  getBanners,
  saveBanner,
  checkDuplicateBanner,
  deleteBanner,
} from "../../helpers/banner/bannerRepo";

import Spin from "../../components/uielements/spin";
import Modal from "../../components/feedback/modal";
import { BannerItem } from "../../components/banner/BannerItem";
import Scrollbars from "../../components/utility/customScrollBar.js";

import { getCustomers } from "../../helpers/user/userRepo";

import { getServices } from "../../helpers/service/serviceRepo";

import { saveNotification } from "../../helpers/notification/notificationRepo";

import "./index.css";

import {
  Row,
  Col,
  Icon,
  Input,
  Upload,
  Form,
  Switch,
  Select,
  Radio,
  Button,
  message,
  Checkbox,
  Popconfirm,
} from "antd";

const { TextArea } = Input;
const { Option } = Select;

const ButtonGroup = Button.Group;

function getBase64(img, callback) {
  const reader = new FileReader();
  reader.addEventListener("load", () => callback(reader.result));
  reader.readAsDataURL(img);
}

function beforeUpload(file) {
  return false;
}

export class banner extends Component {
  constructor() {
    super();
    this.state = {
      banners: [],
      bannersLoading: false,
      displayDeleted: false,
      searchText: "",
      banner: {},
      selectedBanner: {},
      eligibilities: [],
      bannerImage: null,
      bannerModalActive: false,
      bannerImageModalActive: false,
      previewImage: "",
      isUpdating: false,
      isSaving: false,
      isDeleting: false,
      isSending: false,
      isValidatingBanner: false,
      bannerValidatingStatus: "success",
      bannerValidatingMessage: "",
      isFeatured: false,
      notificationModalActive: false,
      bannerUsers: [],
      allUsersSelected: true,
      selectedBannerUsers: [],
      customers: [],
      broadcastBanner: "",
      isImgLoaded: false,
      isDuplicate: false,
    };
  }

  componentDidMount() {
    this.loadCustomers();
    this.loadBanners();
  }

  // Initialize values
  loadBanners = async () => {
    try {
      this.setState(
        {
          bannersLoading: true,
        },
        async () => {
          let banners = await getBanners();
          this.setState({
            bannersLoading: false,
            banners: banners !== undefined ? [...banners] : [],
          });
        }
      );
    } catch (error) {
      console.log(error);
    }
  };

  refreshBannerList = () => {
    this.setState(
      {
        selectedBanner: {},
      },
      () => {
        this.loadBanners();
      }
    );
  };

  loadCustomers = async () => {
    let customers = await getCustomers();
    this.setState({
      customers: [...customers],
    });
  };

  imageFileChange = (info) => {
    let _this = this;
    let _URL = window.URL || window.webkitURL;

    let file, image;

    if ((file = info.file)) {
      image = new Image();

      image.onload = () => {
        let imageAspectRatio = calculateAspectRatio(image.width, image.height);
        console.log(imageAspectRatio);
        if (imageAspectRatio == "7:3") {
          getBase64(file, (imageUrl) => {
            _this.setState({
              bannerImage: imageUrl,
              isImgLoaded: true,
            });
          });
        } else {
          message.error("Image must have a 7:3 aspect ratio.");
          this.setState({
            isImgLoaded: false,
          });
        }
      };

      image.src = _URL.createObjectURL(file);
    }
  };

  displayBannerDetails = (banner) => {
    this.setState({
      selectedBanner: banner,
    });
  };

  featureChange = (e) => {};

  inPercentChange = (e) => {};

  openBannerModal = () => {
    this.setState({
      bannerModalActive: true,
    });
  };

  closeBannerModal = () => {
    this.setState({
      bannerModalActive: false,
      isUpdating: false,
      banner: {},
      isValidatingBanner: false,
      bannerValidatingStatus: "success",
      bannerValidatingMessage: "",
    });
  };

  updateBanner = () => {
    const { selectedBanner } = this.state;

    this.setState({
      isUpdating: true,
      bannerModalActive: true,

      bannerImage: selectedBanner.imageUrl,
    });
  };

  imagePreview = (url) => {
    this.setState({
      bannerImageModalActive: !this.state.bannerImageModalActive,
      previewImage: url,
    });
  };

  bannerTitleChange = _.debounce((title) => {
    this.setState(
      {
        isValidatingBanner: true,
      },
      async () => {
        const { selectedBanner, isUpdating } = this.state;

        if (isUpdating) {
          if (selectedBanner.title === title.toUpperCase()) {
            this.setState({
              isValidatingBanner: false,
              bannerValidatingStatus: "success",
              bannerValidatingMessage: "",
            });
          } else {
            let data = await checkDuplicateBanner(title.toUpperCase());
            this.setState({
              isValidatingBanner: false,
              bannerValidatingStatus: data.code,
              bannerValidatingMessage: data.message,
              isDuplicate: data.code === "error" ? true : false,
            });
          }
        } else {
          let data = await checkDuplicateBanner(title.toUpperCase());
          this.setState({
            isValidatingBanner: false,
            bannerValidatingStatus: data.code,
            bannerValidatingMessage: data.message,
            isDuplicate: data.code === "error" ? true : false,
          });
        }
      }
    );
  }, 500);

  saveBanner = async () => {
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        let newBanner;
        const { isUpdating, selectedBanner } = this.state;

        let _this = this;
        let _URL = window.URL || window.webkitURL;

        let file, image;
        file = values.imageUrl ? values.imageUrl.file : null;
        if (file) {
          image = new Image();

          image.onload = () => {
            let imageAspectRatio = calculateAspectRatio(
              image.width,
              image.height
            );

            if (imageAspectRatio == "7:3") {
              newBanner = {
                title: values.title.toUpperCase(),
                status: values.status,
                description: values.description,
                isFeatured: values.isFeatured,
                isDeleted: false,
              };

              if (isUpdating) {
                newBanner.uid = selectedBanner.uid;
                newBanner.imageUrl = selectedBanner.imageUrl;
              }

              try {
                _this.setState(
                  {
                    isSaving: true,
                  },
                  async () => {
                    const { isDuplicate } = this.state;
                    if (isDuplicate === false) {
                      await saveBanner(
                        Object.assign({}, newBanner),
                        values.imageUrl ? values.imageUrl.file : null
                      );
                      message.success("Banner saved.");
                      _this.setState({
                        isSaving: false,
                        isUpdating: false,
                        banner: {},
                        bannerModalActive: false,
                        bannerImage: null,
                        selectedBanner: {},
                        isDuplicate: false,
                      });

                      _this.loadBanners();
                    }
                  }
                );
              } catch (error) {
                console.log(error);
                message.error("Oop! Something went wrong.");
              }
            } else {
              message.error("Image must have a 7:3 aspect ratio.");
            }
          };

          image.src = _URL.createObjectURL(file);
        } else {
          newBanner = {
            title: values.title.toUpperCase(),
            status: values.status,
            description: values.description,
            isFeatured: values.isFeatured,
          };

          if (isUpdating) {
            newBanner.uid = selectedBanner.uid;
            newBanner.imageUrl = selectedBanner.imageUrl;
          }

          try {
            _this.setState(
              {
                isSaving: true,
              },
              async () => {
                const { isDuplicate } = this.state;
                if (isDuplicate === false) {
                  await saveBanner(
                    Object.assign({}, newBanner),
                    values.imageUrl ? values.imageUrl.file : null
                  );
                  message.success("Banner saved.");
                  _this.setState({
                    isSaving: false,
                    isUpdating: false,
                    banner: {},
                    bannerModalActive: false,
                    bannerImage: null,
                    selectedBanner: {},
                    isDuplicate: false,
                  });

                  _this.loadBanners();
                }
              }
            );
          } catch (error) {
            console.log(error);
            message.error("Oop! Something went wrong.");
          }
        }
      } else {
        console.log(err);
        this.setState({
          bannerValidatingStatus: "error",
          bannerValidatingMessage: err.code.errors[0].message,
        });
      }
    });
  };

  openNotificationModal = async () => {
    const { selectedBanner } = this.state;

    this.loadCustomers();

    this.setState({
      broadcastBanner: selectedBanner.title,
      notificationModalActive: true,
    });
  };

  closeNotificationModal = () => {
    this.setState({
      notificationModalActive: false,
      allUsersSelected: true,
      broadcastBanner: "",
    });
  };

  userSelectedChange = (e) => {
    this.setState({
      allUsersSelected: e.target.checked,
    });
  };

  handleUserChange = (key, value) => {
    this.setState({
      selectedBannerUsers: [...value],
    });
  };

  sendNotification = (notification) => {
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        try {
          const {
            selectedBannerUsers,
            allUsersSelected,
            customers,
            broadcastBanner,
            selectedBanner,
          } = this.state;

          let users = [];
          if (allUsersSelected) {
            for (var sp of customers) {
              if (sp.fcmToken !== "" && sp.fcmToken !== undefined) {
                users.push({
                  uid: sp.uid,
                  fcmToken: sp.fcmToken,
                });
              }
            }
          } else {
            for (var sp of selectedBannerUsers) {
              if (sp.props.value !== "" && sp.props.value !== undefined) {
                users.push({
                  uid: sp.key,
                  fcmToken: sp.props.value,
                });
              }
            }
          }

          let newNotif = {
            title: values.title,
            body: values.body,
            type: "banner",
            data: {
              bannerUid: selectedBanner.uid,
            },
          };

          this.setState(
            {
              isSending: true,
            },
            async () => {
              await saveNotification(users, newNotif);
              message.success(`Sending notifications for ${broadcastBanner}`);
              this.setState({
                isSending: false,
                broadcastBanner: "",
                selectedBannerUsers: [],
                notificationModalActive: false,
              });
            }
          );
        } catch (error) {
          console.log(error);
          message.error("Oop! Something went wrong.");
        }
      }
    });
  };

  deleteBanner = async () => {
    try {
      this.setState(
        {
          isDeleting: true,
        },
        async () => {
          const { selectedBanner } = this.state;

          await deleteBanner(selectedBanner.uid);
          this.setState({
            isDeleting: false,
            selectedBanner: {},
          });
          message.success("Banner deleted.");
          await this.loadBanners();
        }
      );
    } catch (error) {
      console.log(error);
      message.error(`[ERROR] ${error.message}`);
      throw error;
    }
  };

  render() {
    const {
      bannerModalActive,
      bannerImageModalActive,
      notificationModalActive,
      broadcastBanner,
      allUsersSelected,
      customers,
      previewImage,
      bannersLoading,
      banners,
      selectedBanner,
      isUpdating,
      isSaving,
      isSending,
      isDeleting,
      bannerImage,
      isValidatingBanner,
      bannerValidatingMessage,
      bannerValidatingStatus,
      isDuplicate,
    } = this.state;

    const { getFieldDecorator, getFieldValue } = this.props.form;

    return (
      <div>
        <div className="content-header">Banners</div>
        <div style={{ display: "flex", height: this.props.height - 130 }}>
          <div
            style={{
              position: "relative",
              flex: "1 0 25%",
              maxWidth: "420px",
              minWdith: "140px",
            }}
          >
            <div className="banner-list-header">
              <Button
                style={{ float: "left", zIndex: "10" }}
                onClick={this.openBannerModal}
              >
                <Icon type="plus" />
                New Banner
              </Button>
              <Button
                style={{ float: "right", zIndex: "10" }}
                onClick={this.refreshBannerList}
              >
                <Icon type="retweet" />
              </Button>
            </div>
            <div className="banner-list-body">
              {bannersLoading ? (
                <div style={{ marginTop: "200px", textAlign: "center" }}>
                  <Spin size="large" />
                </div>
              ) : banners.length == 0 ? (
                <p className="banner-no-list">No banner on the list.</p>
              ) : (
                <Scrollbars style={{ height: this.props.height - 240 }}>
                  {banners.map((data, i) => (
                    <BannerItem
                      displayBannerDetails={this.displayBannerDetails}
                      key={i}
                      banner={data}
                    />
                  ))}
                </Scrollbars>
              )}
            </div>
            <div className="promo-list-footer">
              {/* <div style={{ textAlign: "left", flex : "1" }}>
                                    { hasPrev && <Button  disabled={bannersLoading} onClick={this.prevPage} icon="caret-left" type="default"></Button> }
                                </div>
                                <div style={{ textAlign: "center", flex : "1" }}>
                                    { promotions && promotions.length > 0 && <span style={{ display: "block", marginTop:"10px", color: "#1b1b1b"}}>Page 1</span> }
                                </div>
                                <div style={{ textAlign: "right", flex : "1" }}>
                                    { hasNext && <Button style={{ float: "right" }} disabled={bannersLoading} onClick={this.nextPage} icon="caret-right" type="default"></Button>}
                                </div> */}
            </div>
          </div>
          <div style={{ flex: "1 1 0%", maxWidth: this.props.view }}>
            <div
              style={{
                flex: "2 0 0%",
                width: "100%",
                overflow: "hidden",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                borderLeft: "1px solid #e4e4e4",
              }}
            >
              <div className="banner-details-header">
                {Object.keys(selectedBanner).length == 0 ? (
                  ""
                ) : (
                  <div className="bd-actions">
                    <ButtonGroup>
                      <Button
                        onClick={this.updateBanner}
                        loading={isSaving}
                        title="Update banner"
                        className="action-update"
                      >
                        <Icon type="edit" />
                      </Button>
                      <Popconfirm
                        title="Are you sure you want to remove this banner?"
                        onConfirm={this.deleteBanner}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Button
                          loading={isDeleting}
                          title="Delete banner"
                          className="action-delete"
                        >
                          <Icon type="delete" />
                        </Button>
                      </Popconfirm>
                      <Button
                        title="Broadcast notification"
                        loading={isSending || isDeleting}
                        className="action-broadcast"
                        onClick={this.openNotificationModal}
                      >
                        <Icon type="notification" />
                      </Button>
                    </ButtonGroup>
                  </div>
                )}
              </div>
              <div className="banner-details-body">
                {Object.keys(selectedBanner).length == 0 ? (
                  <p className="no-selected-banner">Please select a banner</p>
                ) : (
                  <Scrollbars style={{ height: this.props.height - 190 }}>
                    <div className="banner-details">
                      <div className="bd-section">
                        <p className="bd-section-header">Banner Information</p>
                        <Row style={{ marginBottom: "10px" }}>
                          <Col span={12}>
                            <span className="bd-label">TITLE</span>
                            <span className="bd-value">
                              {selectedBanner.title}
                            </span>
                          </Col>
                        </Row>
                        <Row style={{ marginBottom: "10px" }}>
                          <Col span={24}>
                            <span className="bd-label">DESCRIPTION</span>
                            <span className="bd-value">
                              {selectedBanner.description}
                            </span>
                          </Col>
                        </Row>
                        <Row style={{ marginBottom: "10x" }}>
                          <Col span={24}>
                            <span className="bd-label">BANNER PHOTO</span>
                            <img
                              className="bd-image"
                              onClick={() =>
                                this.imagePreview(selectedBanner.imageUrl)
                              }
                              src={selectedBanner.imageUrl}
                            />
                          </Col>
                        </Row>
                      </div>
                    </div>
                  </Scrollbars>
                )}
              </div>
            </div>
          </div>
          {/* 
                            MODALS
                        */}

          {bannerImageModalActive && (
            <Modal
              visible={bannerImageModalActive}
              footer={null}
              onCancel={() => this.imagePreview("")}
            >
              <img style={{ width: "100%" }} src={previewImage} />
            </Modal>
          )}
          {notificationModalActive && (
            <Modal
              width={500}
              visible={notificationModalActive}
              onClose={this.closeNotificationModal}
              title="Send notification"
              okText="Send"
              onOk={this.sendNotification}
              onCancel={this.closeNotificationModal}
              confirmLoading={isSending}
              okButtonProps={{ disabled: isSending }}
              cancelButtonProps={{ disabled: isSending }}
              closable={false}
              maskClosable={false}
            >
              <Form>
                <Row gutter={24}>
                  <Col>
                    <Form.Item label="Title">
                      {getFieldDecorator("title", {
                        rules: [
                          {
                            required: true,
                            message: "Please input a title",
                          },
                        ],
                      })(
                        <Input
                          placeholder={`Notification title for ${broadcastBanner}`}
                          className="form-control"
                        />
                      )}
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={24}>
                  <Col>
                    <Form.Item label="Message">
                      {getFieldDecorator("body", {
                        rules: [
                          { required: true, message: "Please add a message" },
                        ],
                      })(
                        <TextArea
                          rows={3}
                          placeholder={`Notification body for ${broadcastBanner}`}
                        ></TextArea>
                      )}
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item label="">
                  {getFieldDecorator("isAll", {
                    initialValue: allUsersSelected,
                    valuePropName: "checked",
                  })(
                    <Checkbox onChange={this.userSelectedChange}>
                      Select All
                    </Checkbox>
                  )}
                </Form.Item>
                {!allUsersSelected && (
                  <Row gutter={24}>
                    <Col>
                      <Form.Item label="Users">
                        {getFieldDecorator("users", {
                          rules: [
                            {
                              required: true,
                              message: "Please select user/s.",
                            },
                          ],
                        })(
                          <Select
                            placeholder="Select user/s"
                            size="large"
                            mode="multiple"
                            onChange={this.handleUserChange}
                          >
                            {customers.map((data, key) => (
                              <Option key={data.uid} value={data.fcmToken}>
                                {data.fullName}
                              </Option>
                            ))}
                          </Select>
                        )}
                      </Form.Item>
                    </Col>
                  </Row>
                )}
              </Form>
            </Modal>
          )}
          {bannerModalActive && (
            <Modal
              width={900}
              visible={bannerModalActive}
              onClose={this.closeBannerModal}
              title={isUpdating ? "Update Banner" : "New Banner"}
              okText="Submit"
              onOk={this.saveBanner}
              onCancel={this.closeBannerModal}
              confirmLoading={isSaving}
              okButtonProps={{
                disabled:
                  isSaving || isValidatingBanner || isDuplicate ? true : false,
              }}
              cancelButtonProps={{
                disabled:
                  isSaving || isValidatingBanner || isDuplicate ? true : false,
              }}
              closable={false}
              maskClosable={false}
            >
              <Form>
                <Row gutter={24}>
                  <Col span={12}>
                    <Row gutter={24}>
                      <Col span={16}>
                        <Form.Item
                          label="Banner Title"
                          validateStatus={
                            isValidatingBanner
                              ? "validating"
                              : bannerValidatingStatus
                          }
                          help={
                            isValidatingBanner ? "" : bannerValidatingMessage
                          }
                        >
                          {getFieldDecorator("title", {
                            initialValue: isUpdating
                              ? selectedBanner.title
                              : "",
                            rules: [
                              {
                                required: true,
                                message: "Please input a banner title",
                              },
                            ],
                          })(
                            <Input
                              placeholder="Enter banner title"
                              className="form-control upper"
                              onChange={(e) =>
                                this.bannerTitleChange(e.target.value)
                              }
                            />
                          )}
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="Featured">
                          {getFieldDecorator("isFeatured", {
                            valuePropName: "checked",
                            initialValue: isUpdating
                              ? selectedBanner.isFeatured
                              : false,
                          })(
                            <Switch
                              onChange={this.handleFeatureChange}
                              checkedChildren="Yes"
                              unCheckedChildren="No"
                            />
                          )}
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item label="Banner image">
                      {getFieldDecorator("imageUrl", {
                        rules: [
                          {
                            required: isUpdating ? false : true,
                            message: "Please add an image to the banner.",
                          },
                        ],
                      })(
                        <Upload
                          accept="image/*"
                          showUploadList={false}
                          beforeUpload={beforeUpload}
                          onChange={this.imageFileChange}
                        >
                          <Button>
                            <Icon type="upload" /> Upload
                          </Button>
                        </Upload>
                      )}
                      <img
                        style={{ width: "100%", height: "200px" }}
                        src={bannerImage}
                      ></img>
                    </Form.Item>
                    <Form.Item label="Banner description">
                      {getFieldDecorator("description", {
                        initialValue: isUpdating
                          ? selectedBanner.description
                          : "",
                        rules: [
                          {
                            required: true,
                            message: "Please add a description to the banner.",
                          },
                        ],
                      })(
                        <TextArea
                          onBlur={this.handleDescriptionOnBlur}
                          rows={2}
                        ></TextArea>
                      )}
                    </Form.Item>
                    <Form.Item label="Status">
                      {getFieldDecorator("status", {
                        initialValue: isUpdating
                          ? selectedBanner.status
                          : "draft",
                      })(
                        <Radio.Group value="draft">
                          <Radio.Button value="draft">Draft</Radio.Button>
                          <Radio.Button value="published">
                            Published
                          </Radio.Button>
                        </Radio.Group>
                      )}
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Modal>
          )}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  ...state.App,
});
const WrappedBanner = Form.create()(banner);
export default connect(mapStateToProps)(WrappedBanner);
