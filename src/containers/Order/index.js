import React, { Component } from "react";
import { connect } from "react-redux";
import _ from "lodash/";

import { getCustomers, getCouriers } from "../../helpers/user/userRepo";

import OrderHelper from "../../helpers/order";

import {
  getOrders,
  saveOrder,
  updateOrderStatus,
  deleteOrder,
  searchOrders,
  checkSinglePromoCodeEligibility,
  checkGeneralPromoCodeEligibility,
} from "../../helpers/order/orderRepo";

import { getServices } from "../../helpers/service/serviceRepo";

import Map from "../../components/googleMaps/Map";
import AutoComplete from "../../components/googleMaps/AutoComplete";
import Tags from "../../components/uielements/tag";
import Modal from "../../components/feedback/modal";
import Spin from "../../components/uielements/spin";
import TagWrapper from "../../containers/Tags/tag.style";
import OrderItem from "../../components/order/OrderItem";
import Scrollbars from "../../components/utility/customScrollBar.js";

import Timeline, { TimelineItem } from "../../components/uielements/timeline";

import "./index.css";

import {
  Row,
  Col,
  Icon,
  Input,
  Upload,
  Form,
  Select,
  message,
  Button,
  Popconfirm,
  Tooltip,
} from "antd";

import moment from "moment";

const { TextArea } = Input;
const { Option } = Select;

const ButtonGroup = Button.Group;

const Tag = (props) => (
  <TagWrapper>
    <Tags {...props}>{props.children}</Tags>
  </TagWrapper>
);

let id = 0;

export class Order extends Component {
  constructor() {
    super();
    this.state = {
      orders: [],
      ordersLoading: true,
      orderPage: 1,
      couriers: [],
      couriersLoading: true,
      customers: [],
      customersLoading: true,
      services: [],
      servicesLoading: true,
      isSaving: false,
      isUpdating: false,
      isDeleting: false,
      searchString: "",
      orderModalActive: false,
      selectedOrder: {},
      order: {},
      items: [],
      itemCount: 0,
      mapLng: 1,
      mapLat: 1,
      mapAddress: "",
      mapAddressComponents: [],
      autocompleteLat: 1,
      autocompleteLng: 1,
      autocompleteAddress: "",
      autocompleteAddressComponents: [],
      rLat: 1,
      rLng: 1,
      rAddress: "",
      rAddressComponents: {},
      markerDraggable: false,
      mapModalActive: false,
      isGettingMapLocation: false,
      errors: {},
      hasNext: null,
      hasPrev: null,
      searchField: "",
      statusModalActive: false,
      statusOnTheWay: false,
      statusPaid: false,
      updateStatusValue: "",
      updateStatusCourier: {},
      updateStatusError: true,
      updateStatusValidation: "",
      updateStatusFileList: [],
      timelineModalActive: false,
      orderItems: {},
      viewImageModal: false,
      previewImage: "",
      isCheckingPromoCode: false,
      hasSinglePromo: false,
      hasGeneralPromo: false,
      generalPromo: "",
      isGeneralPromoValid: false,
      generalPromoErrors: [],
    };
  }

  componentDidMount() {
    const script = document.createElement("script");

    script.src =
      "https://maps.googleapis.com/maps/api/js?key=AIzaSyCdpvUgaSmIUmvxIOtOMuubZmVoaEQhwa4&libraries=places";
    script.async = true;

    document.body.appendChild(script);

    this.loadOrders();
    this.loadCustomers();
    this.loadCouriers();
    this.loadServices();
    this.getGeoLocation();
  }

  /**
   * Load initial data from database
   */
  loadOrders = async (action = "load", prevRef = null, nextRef = null) => {
    try {
      this.setState(
        {
          ordersLoading: true,
        },
        async () => {
          let orderData;
          const { orderPage, searchString, searchField } = this.state;
          let searchData = null;

          if (searchField !== "") {
            searchData = {
              field: searchField,
              searchString: searchString,
            };
          }

          if (
            searchField === "" ||
            searchString === "" ||
            searchString === null
          ) {
            searchData = null;
          }

      
          switch (action) {
            case "next":
              orderData = await getOrders(orderPage, null, nextRef, searchData);
              break;
            case "prev":
              orderData = await getOrders(orderPage, prevRef, null, searchData);
              break;
            default:
              orderData = await getOrders(1, null, null, searchData);
              break;
          }
        

          if (action === "next" && orderData.orders.length === 0) {
            orderData.orders = this.state.orders;
            orderData.nextRef = this.state.hasNext;
            orderData.prevRef = this.state.hasPrev;
          }

          this.setState({
            ordersLoading: false,
            orders: [...orderData.orders],
            hasNext: orderData.nextRef,
            hasPrev: orderData.prevRef,
            orderPage: orderData.orderPage,
          });
        }
      );
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  refreshOrderList = async () => {
    this.setState(
      {
        selectedOrder: {},
      },
      () => {
        this.loadOrders();
      }
    );
  };

  loadCouriers = async () => {
    let couriers = await getCouriers();
    this.setState({
      couriersLoading: false,
      couriers: [...couriers],
    });
  };

  loadCustomers = async () => {
    let customers = await getCustomers();
    this.setState({
      customersLoading: false,
      customers: [...customers],
    });
  };

  loadServices = async () => {
    let services = await getServices();
    this.setState({
      servicesLoading: false,
      services: [...services],
    });
  };
  /**
   * End
   */

  searchOrders = _.debounce(async (keyword) => {
    if (keyword.length) {
      this.setState(
        {
          ordersLoading: true,
          orders: [],
        },
        async () => {
          let orders = await searchOrders(keyword);
          this.setState({
            ordersLoading: false,
            orders: [...orders],
            hasNext: null,
            hasPrev: null,
            orderPage: "Result",
          });
        }
      );
    } else {
      this.loadOrders();
    }
  }, 500);

  displayOrderDetails = (order) => {
    this.setState({
      selectedOrder: { ...order },
    });
  };

  /**
   * Pagination functions
   */
  nextPage = () => {
    const { hasNext } = this.state;
    this.loadOrders("next", null, hasNext);
  };

  prevPage = () => {
    const { hasPrev } = this.state;
    this.loadOrders("prev", hasPrev);
  };
  /**
   * End
   */

  /**
   * Add Item
   */
  addItem = () => {
    const { form } = this.props;
    const keys = form.getFieldValue("keys");

    const nextKeys = keys.concat(id++);
    // can use data-binding to set
    // important! notify form to detect changes
    form.setFieldsValue({
      keys: nextKeys,
    });

    this.setState({
      items: [...this.state.items, {}],
    });
  };

  removeItem = (index, wew) => {
    const { form } = this.props;
    // can use data-binding to get
    const keys = form.getFieldValue("keys");
    // We need at least one passenger
    if (keys.length === 1) {
      return;
    }
    // can use data-binding to set
    form.setFieldsValue({
      keys: keys.filter((key) => key !== index),
    });

    this.state.items.splice(wew, 1);

    this.setState(
      {
        items: this.state.items,
      },
      () => {
        const { items, hasSinglePromo, generalPromo } = this.state;

        if (!hasSinglePromo) {
          this.checkGeneralPromoCode(generalPromo);
        } else {
          items.map((data, i) => {
            if (!data.isDuplicate)
              this.checkSinglePromoCode(data.singlePromoCode, i);
          });
        }
      }
    );
  };

  itemDescriptionBlur = (e, index) => {
    if (e.target.value !== "" && index !== undefined) {
      const { items } = this.state;

      items[index].description = e.target.value;
      this.setState({
        items,
      });
    }
  };

  itemServiceChange = (value, index) => {
    const { services, items } = this.state;

    items[index].serviceType = value;
    let itemPrice = services.filter((service) => {
      return service.serviceName === value;
    });
    items[index].servicePrice = itemPrice[0].priceInRp;
    this.setState(
      {
        items,
      },
      () => {
        const { items, hasSinglePromo, generalPromo } = this.state;

        if (!hasSinglePromo) {
          this.checkGeneralPromoCode(generalPromo);
        } else {
          items.map((data, i) => {
            if (!data.isDuplicate)
              this.checkSinglePromoCode(data.singlePromoCode, i);
          });
        }
      }
    );
  };

  handleFileChange = (e, index) => {
    if (e !== undefined) {
      let fileList = [...e.fileList];

      fileList = fileList.slice(-1);

      // 2. Read from response and show file link
      fileList = fileList.map((file) => {
        if (file.response) {
          // Component will show file.url as link
          file.url = file.response.url;
        }
        return file;
      });

      const { items } = this.state;
      items[index].fileList = [];
      items[index].fileList.push(e.file);
      items[index].file = e.file;
      this.setState({
        items,
      });
    }
  };

  handleFileOnRemove = (index) => {
    const { items } = this.state;

    items[index].file = {};
    items[index].fileList = [];

    this.setState({
      items,
    });
  };

  handleFileBeforeUpload = (file, index) => {
    const { items } = this.state;
    items[index].file = file;

    this.setState({
      items,
    });

    return false;
  };

  customerChange = (value, e) => {
    const { children } = e.props;
    const { order, customers } = this.state;

    order.customerName = children;
    order.customerUid = value;

    const { form } = this.props;

    let sCustomer = customers.filter((customer) => {
      return customer.uid === value;
    });

    form.setFieldsValue({
      customerPhoneNumber: sCustomer[0].phoneNumber
        ? sCustomer[0].phoneNumber
        : "",
    });

    this.setState({
      order: { ...this.state.order },
    });
  };

  updateOrder = () => {
    const { selectedOrder, order } = this.state;
    order.customerName = selectedOrder.customerName;
    order.customerUid = selectedOrder.customerUid;
    order.addressText = selectedOrder.addressText;
    order.addressLocation = {
      lat: selectedOrder.addressLocation.latitude,
      lng: selectedOrder.addressLocation.longitude,
    };

    let orderItems = [];
    let singlePromoCt = 0;
    selectedOrder.items.map((data, i) => {
      orderItems.push({
        ...data,
        promoErrors: [],
        isDuplicate: false,
        isDeleted: false,
        isValid:
          selectedOrder.hasOwnProperty("singlePromoCodes") &&
          selectedOrder.singlePromoCodes[i] !== ""
            ? true
            : false,
        isSinglePromoCodeDisplayed:
          selectedOrder.hasOwnProperty("singlePromoCodes") &&
          selectedOrder.singlePromoCodes[i] !== ""
            ? true
            : false,
        singlePromoCode: selectedOrder.hasOwnProperty("singlePromoCodes")
          ? selectedOrder.singlePromoCodes[i]
          : [],
        isGeneralPromoValid: selectedOrder.promotionCode !== "" ? true : false,
        generalPromo:
          selectedOrder.promotionCode !== "" ? selectedOrder.promotionCode : "",
      });

      if (
        selectedOrder.hasOwnProperty("singlePromoCodes") &&
        selectedOrder.singlePromoCodes[i] !== ""
      ) {
        singlePromoCt++;
      }
    });

    this.setState(
      {
        isUpdating: true,
        orderModalActive: true,
        mapLat: selectedOrder.addressLocation.latitude,
        mapLng: selectedOrder.addressLocation.longitude,
        rAddress: selectedOrder.addressText,
        items: [...orderItems],
        order: { ...order },
        hasSinglePromo: singlePromoCt != 0 ? true : false,
        hasGeneralPromo: selectedOrder.promotionCode !== "" ? true : false,
        generalPromo:
          selectedOrder.promotionCode !== "" ? selectedOrder.promotionCode : "",
      },
      () => {
        const { form } = this.props;

        form.setFieldsValue({
          addressText: selectedOrder.addressText,
        });
      }
    );
  };

  /**
   * Google maps function
   */
  getGeoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.setState({
          mapLat: position.coords.latitude,
          mapLng: position.coords.longitude,
        });
      });
    }
  };

  openMapModal = () => {
    this.setState({
      mapModalActive: true,
    });
  };

  closeMapModal = () => {
    this.setState({
      mapModalActive: false,
    });
  };

  setAddressFromAutocomplete = (lng, lat, address, addressComponents) => {
    const { order } = this.state;

    order.addressText = address;
    order.addressLocation = { lat: lat, lng: lng };
    const { form } = this.props;

    form.setFieldsValue({
      addressText: address,
    });

    this.setState(
      {
        rLat: lat,
        rLng: lng,
        rAddress: address,
        rAddressComponents: [...addressComponents],
        order: { ...this.state.order },
      },
      () => {
        const { items } = this.state;

        items.map((data, i) => {
          if (!data.isDuplicate)
            this.checkSinglePromoCode(data.singlePromoCode, i);
        });
      }
    );
  };

  setAddressFromMap = (lng, lat, address, addressComponents) => {
    const { order } = this.state;

    order.addressText = address;
    order.addressLocation = { lat: lat, lng: lng };
    const { form } = this.props;

    form.setFieldsValue({
      addressText: address,
    });

    this.setState(
      {
        mapLat: lat,
        mapLng: lng,
        mapAddress: address,
        mapAddressComponents: [...addressComponents],
        order: { ...this.state.order },
      },
      () => {
        const { items } = this.state;

        items.map((data, i) => {
          if (!data.isDuplicate)
            this.checkSinglePromoCode(data.singlePromoCode, i);
        });
      }
    );
  };

  getMapResults = () => {
    const {
      order,
      mapLat,
      mapLng,
      mapAddress,
      mapAddressComponents,
    } = this.state;

    order.addressText = mapAddress;
    order.addressLocation = { lat: mapLat, lng: mapLng };
    const { form } = this.props;

    form.setFieldsValue({
      addressText: mapAddress,
    });

    this.setState({
      rLat: mapLat,
      rLng: mapLng,
      rAddress: mapAddress,
      rAddressComponents: [...mapAddressComponents],
      order: { ...this.state.order },
      mapModalActive: false,
    });
  };

  setAddress = (lng, lat, address, addressComponents) => {
    const { order } = this.state;

    order.addressText = address;
    order.addressLocation = { lat: lat, lng: lng };
    const { form } = this.props;

    form.setFieldsValue({
      addressText: address,
    });

    this.setState({
      mapLat: lat,
      mapLng: lng,
      mapAddress: address,
      mapAddressComponents: [...addressComponents],
      order: { ...this.state.order },
    });
  };

  /**
   * End
   */

  clearState = async () => {
    await this.getGeoLocation();

    this.setState({
      isSaving: false,
      isUpdating: false,
      orderModalActive: false,
      items: [],
      order: {},
      selectedOrder: {},
      rAddress: "",
      rLat: this.state.mapLat,
      rLng: this.state.mapLng,
      rAddressComponents: [],
    });
  };

  /**
   * CRUD functions
   */
  openOrderModal = () => {
    const { form } = this.props;
    let keys = form.getFieldValue("keys");
    keys = [];

    const nextKeys = keys.concat(id++);
    // can use data-binding to set
    // important! notify form to detect changes
    form.setFieldsValue({
      keys: nextKeys,
    });

    this.setState({
      orderModalActive: true,
      items: [...this.state.items, {}],
    });
  };

  closeOrderModal = async () => {
    await this.getGeoLocation();

    this.setState({
      orderModalActive: false,
      isUpdating: false,
      isSaving: false,
      items: [],
      rAddress: "",
      rLat: 1,
      rLng: 1,
      rAddressComponents: [],
      generalPromoErrors: [],
      generalPromo: "",
      hasGeneralPromo: false,
    });
  };

  saveOrder = async (action) => {
    const {
      order,
      items,
      mapLat,
      mapLng,
      rAddress,
      rLat,
      rLng,
      isUpdating,
      selectedOrder,
      hasSinglePromo,
      isGeneralPromoValid,
      hasGeneralPromo,
      generalPromo,
    } = this.state;
    let orderToSave;

    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        if (items.length > 0) {
          let totalPrice = 0;
          let promoCodeArr = [];
          items.map((data) => {
            if (hasSinglePromo) {
              if (data.isValid) {
                totalPrice += data.adjustedPrice;
              } else {
                totalPrice += data.servicePrice;
              }
            } else {
              if (
                data.adjustedPrice !== undefined &&
                data.adjustedPrice !== 0
              ) {
                totalPrice += data.adjustedPrice;
              } else {
                totalPrice += data.servicePrice;
              }
            }

            promoCodeArr.push(
              data.singlePromoCode === undefined ? "" : data.singlePromoCode
            );
          });

          if (isUpdating) {
            // selectedOrder.totalPrice = totalPrice;
            orderToSave = {
              ...order,
              addressText: rAddress,
              addressLocation: { lat: mapLat, lng: mapLng },
              courierName: selectedOrder.courierName,
              courierUid: selectedOrder.courierUid,
              timeline: [...selectedOrder.timeline],
              promotionCode: hasSinglePromo ? "" : values.promotionCode,
              pickupConfirmationPictures: [
                ...selectedOrder.pickupConfirmationPictures,
              ],
              items: [],
              uid: selectedOrder.uid,
              status: selectedOrder.status,
              totalPrice: parseFloat(totalPrice),
              singlePromoCodes: [...promoCodeArr],
              customerPhoneNumber: values.customerPhoneNumber,
              note: values.notes ? values.notes : "",
              extraTreatment: values.extraTreatment
                ? values.extraTreatment
                : "",
            };
          } else {
            orderToSave = {
              dateSent: new Date(),
              ...order,
              addressText: rAddress,
              addressLocation: { lat: rLat, lng: rLng },
              courierName: "",
              courierUid: "",
              timeline: [],
              items: [],
              pickupConfirmationPictures: [],
              status: "waitingForPickup",
              promotionCode: hasSinglePromo ? "" : values.promotionCode,
              singlePromoCodes: [...promoCodeArr],
              totalPrice: parseFloat(totalPrice),
              isDeleted: false,
              customerPhoneNumber: values.customerPhoneNumber,
              note: values.notes ? values.notes : "",
              extraTreatment: values.extraTreatment
                ? values.extraTreatment
                : "",
            };
          }

          try {
            let invalidCount = 0;
            let emptyCount = 0;
            items.map((data, i) => {
              if (data.isValid === false && data.singlePromoCode !== "") {
                invalidCount++;
              }
              if (
                data.singlePromoCode === "" &&
                data.isSinglePromoCodeDisplayed
              ) {
                emptyCount++;
              }
            });

            let okToSave = false;

            if (hasSinglePromo) {
              if (invalidCount === 0 && emptyCount === 0) {
                okToSave = true;
              }
            } else {
              if (!hasGeneralPromo) {
                okToSave = true;
              } else {
                if (isGeneralPromoValid) {
                  okToSave = true;
                }
              }
            }

            if (okToSave) {
              this.setState(
                {
                  isSaving: true,
                },
                async () => {
                  let uploadArr = {
                    files: items,
                    target: "itemImages",
                  };

                  let result = await saveOrder(
                    Object.assign({}, orderToSave),
                    uploadArr
                  );

                  if (result.code === 204 || result.code === 203) {
                    message.error(result.message);
                    this.setState({
                      isSaving: false,
                    });
                  } else {
                    message.success(result.message);
                    await this.loadOrders();
                    this.clearState();
                  }
                }
              );
            }
          } catch (error) {
            console.log(error);
            throw error;
          }
        } else {
          message.warning("Please input items.");
        }
      }
    });
  };

  deleteOrder = async () => {
    try {
      const { selectedOrder } = this.state;

      await deleteOrder(selectedOrder.uid);
      this.setState({
        selectedOrder: {},
      });
      message.success("Order deleted.");
      await this.loadOrders();
    } catch (error) {
      console.log(error);
      message.error("Oops! Something went wrong.");
      throw error;
    }
  };

  openStatusModal = () => {
    this.setState({
      statusModalActive: true,
    });
  };

  closeStatusModal = () => {
    this.setState({
      statusModalActive: false,
      statusOnTheWay: false,
      statusPaid: false,
    });
  };

  saveOrderStatus = async () => {
    this.props.form.validateFieldsAndScroll(
      ["upStatus", "upCourier", "confirmationPics"],
      (err, values) => {
        if (!err) {
          let orderData = {};
          let imgList = [];

          if (values.upStatus === "onTheWay") {
            const { couriers } = this.state;

            let courier = couriers.filter((c) => c.uid === values.upCourier);

            orderData = {
              status: values.upStatus,
              courierName: courier[0].fullName,
              courierUid: courier[0].uid,
            };
          } else if (values.upStatus === "paidAndOnProgress") {
            const { confirmationPics } = values;

            confirmationPics.fileList.map((data, i) => {
              imgList.push({
                file: data,
              });
            });

            orderData = {
              status: values.upStatus,
            };
          } else {
            orderData = {
              status: values.upStatus,
            };
          }

          try {
            this.setState(
              {
                isSaving: true,
              },
              async () => {
                let t = "";

                if (values.upStatus === "paidAndOnProgress") {
                  t = "pickupConfirmationPictures";
                }

                let uploadArr = {
                  files: imgList,
                  target: t,
                };
                const { selectedOrder } = this.state;

                let result = await updateOrderStatus(
                  Object.assign({}, selectedOrder, orderData),
                  uploadArr
                );

                if (result.code === 204 || result.code === 203) {
                  message.error(result.message);
                  this.setState({
                    isSaving: false,
                  });
                } else {
                  message.success(result.message);
                  this.loadOrders();
                  this.clearState();
                  this.setState({
                    isSaving: false,
                    statusModalActive: !this.state.statusModalActive,
                    statusOnTheWay: false,
                    statusPaid: false,
                  });
                }
              }
            );
          } catch (error) {
            console.log(error);
            throw error;
          }
        }
      }
    );
  };

  statusSelectChange = (value) => {
    switch (value) {
      case "onTheWay":
        this.setState({
          statusOnTheWay: true,
          statusPaid: false,
        });
        break;
      case "paidAndOnProgress":
        this.setState({
          statusOnTheWay: false,
          statusPaid: true,
        });
        break;
      default:
        this.setState({
          statusOnTheWay: false,
          statusPaid: false,
        });
    }

    this.setState({
      updateStatusValue: value,
    });
  };

  onFileChange = (info) => {
    if (info !== null && info !== undefined) {
      this.setState({ updateStatusFileList: [...info.fileList] });
    }
  };

  previewImage = (url) => {
    this.setState({
      viewImageModal: !this.state.viewImageModal,
      previewImage: url,
    });
  };

  displayItemAddPromo = (index) => {
    if (index !== undefined) {
      const { items } = this.state;

      if (items[index].isSinglePromoCodeDisplayed !== undefined) {
        items[index].isSinglePromoCodeDisplayed = !items[index]
          .isSinglePromoCodeDisplayed;
        if (items[index].isSinglePromoCodeDisplayed === false) {
          items[index].promoErrors = [];
          items[index].singlePromoCode = "";
          items[index].isDuplicate = false;
          items[index].isDeleted = true;
          items[index].isValid = false;
        }
      } else {
        items[index].isSinglePromoCodeDisplayed = true;
        items[index].isDeleted = false;
        items[index].singlePromoCode = "";
        items[index].isValid = false;
        this.setState({
          hasSinglePromo: true,
        });
      }

      let sCount = 0;
      items.map((data, i) => {
        if (data.isSinglePromoCodeDisplayed) {
          sCount++;
        }

        if (!data.isDeleted && data.singlePromoCode !== "") {
          this.checkSinglePromoCode(data.singlePromoCode, i);
        }
      });

      this.setState({
        items,
        hasSinglePromo: sCount !== 0 ? true : false,
      });
    }
  };

  checkSinglePromoCode = _.debounce(async (promoCode, index) => {
    const {
      items,
      mapAddress,
      rAddress,
      isUpdating,
      selectedOrder,
      hasSinglePromo,
    } = this.state;

    items[index].isValidatingPromoCode = true;
    items[index].singlePromoCode = promoCode;

    let checkItem = [];
    checkItem.push(items[index]);
    if (
      promoCode !== null &&
      promoCode !== undefined &&
      promoCode.trim().length !== 0
    ) {
      let sameCode = false;
      items.map((data, i) => {
        if (
          i !== index &&
          (data.promoErrors !== undefined &&
            data.promoErrors.indexOf(
              "This promo code has already been used."
            ) === -1)
        ) {
          if (data.singlePromoCode === promoCode) {
            sameCode = true;
          }
        }
      });

      if (sameCode) {
        items[index].promoErrors = ["This promo code has already been used."];
        items[index].isDuplicate = true;
        items[index].isValid = false;
        this.setState({
          items: items,
        });
      } else {
        items[index].isDuplicate = false;

        this.setState(
          {
            isCheckingPromoCode: true,
            items: items,
          },
          async () => {
            let result = await checkSinglePromoCodeEligibility({
              promotionCode: promoCode,
              addressText: rAddress,
              items: checkItem,
            });
            if (result.code === 500) {
              items[index].promoErrors = [...result.errors];
              items[index].isValid = false;
            } else {
              items[index].adjustedPrice = result.data.adjustedPrice;
              items[index].isValid = true;
              items[index].promoErrors = [];
            }

            items[index].isValidatingPromoCode = false;
            this.setState({
              isCheckingPromoCode: false,
              items: items,
            });
          }
        );
      }
    }
  }, 500);

  checkGeneralPromoCode = _.debounce(async (promoCode, index) => {
    const {
      items,
      mapAddress,
      rAddress,
      isUpdating,
      selectedOrder,
      hasSinglePromo,
    } = this.state;

    if (
      promoCode !== null &&
      promoCode !== undefined &&
      promoCode.trim().length !== 0
    ) {
      this.setState(
        {
          isCheckingPromoCode: true,
          hasGeneralPromo: true,
          generalPromo: promoCode,
          items: items,
        },
        async () => {
          let result = await checkGeneralPromoCodeEligibility({
            promotionCode: promoCode,
            addressText: rAddress,
            items: items,
          });

          this.setState({
            isGeneralPromoValid: result.code === 200 ? true : false,
            generalPromoErrors: [...result.errors],
            isCheckingPromoCode: false,
            items: items,
          });
        }
      );
    } else {
      this.setState({
        hasGeneralPromo: false,
      });
    }
  }, 500);

  render() {
    const {
      orders,
      ordersLoading,
      customers,
      couriers,
      services,
      isSaving,
      isDeleting,
      selectedOrder,
      isUpdating,
      orderModalActive,
      items,
      mapLng,
      mapLat,
      rAddress,
      rLat,
      rLng,
      markerDraggable,
      searchString,
      hasPrev,
      hasNext,
      orderPage,
      searchField,
      viewImageModal,
      previewImage,
      statusModalActive,
      statusOnTheWay,
      statusPaid,
      updateStatusError,
      updateStatusValidation,
      updateStatusFileList,
      mapModalActive,
      isGettingMapLocation,
      isCheckingPromoCode,
      hasSinglePromo,
      hasGeneralPromo,
      generalPromoErrors,
    } = this.state;

    const { height } = this.props;
    const { getFieldDecorator, getFieldValue } = this.props.form;
    let formItemValues = [];

    if (isUpdating) {
      let dImageUrl = [];
      let dDesc = [];
      let dService = [];
      selectedOrder.items.map((data, i) => {
        dImageUrl.push(data.imageUrl);
        dDesc.push(data.description);
        dService.push(data.serviceType);

        formItemValues.push({
          item: [...dImageUrl],
          description: [...dDesc],
          serviceType: [...dService],
          promoErrors: [],
          isDuplicate: false,
          isDeleted: false,
          isValid:
            selectedOrder.hasOwnProperty("singlePromoCodes") &&
            selectedOrder.singlePromoCodes[i] !== ""
              ? true
              : false,
          isSinglePromoCodeDisplayed:
            selectedOrder.hasOwnProperty("singlePromoCodes") &&
            selectedOrder.singlePromoCodes[i] !== ""
              ? true
              : false,
          singlePromoCode: selectedOrder.hasOwnProperty("singlePromoCodes")
            ? selectedOrder.singlePromoCodes[i]
            : [],
        });
      });
    } else {
      formItemValues = [];
    }
    getFieldDecorator("keys", { initialValue: [...formItemValues] });
    let keys = getFieldValue("keys");

    const uploadProps = {
      onRemove: (file) => {
        const index = updateStatusFileList.indexOf(file);
        const newList = updateStatusFileList.slice();
        newList.splice(index, 1);

        this.setState({
          updateStatusFileList: [...newList],
        });
      },
      beforeUpload: (file) => {
        updateStatusFileList.push(file);
        this.setState({
          updateStatusFileList: [...updateStatusFileList],
          updateStatusError: false,
        });

        return false;
      },
      updateStatusFileList,
      multiple: true,
    };

    const formItems = keys.map((k, index) => (
      <div
        key={index}
        style={{
          position: "relative",
          borderBottom: "1px solid #e4e4e4",
          paddingBottom: "10px",
          paddingTop: "10px",
        }}
      >
        {keys.length > 1 ? (
          <div>
            <div style={{ float: "right" }}>
              <Button type="danger" onClick={() => this.removeItem(k, index)}>
                <Icon type="delete"></Icon>
              </Button>
            </div>
            <div className="clearfix mb-3"></div>
          </div>
        ) : null}

        <Row style={{ marginTop: "10px" }} gutter={24}>
          <Col span={10}>
            <Form.Item label="Item image">
              {getFieldDecorator(`item[${index}].file`, {
                validateTrigger: ["onChange"],
                rules: [
                  {
                    required: isUpdating ? false : true,
                    message: "Please add an image to the item.",
                  },
                ],
              })(
                <Upload
                  accept="image/*"
                  fileList={items[index] ? items[index].fileList : []}
                  onRemove={() => this.handleFileOnRemove(index)}
                  beforeUpload={(e) => this.handleFileBeforeUpload(e, index)}
                  onChange={(e) => this.handleFileChange(e, index)}
                  multiple={false}
                >
                  <Button>
                    <Icon type="upload" /> Upload
                  </Button>
                </Upload>
              )}
            </Form.Item>
          </Col>
          <Col span={14}>
            <Form.Item label="Item description">
              {getFieldDecorator(`item[${index}].description`, {
                validateTrigger: ["onBlur"],
                initialValue: isUpdating
                  ? items[index] !== undefined
                    ? items[index].description
                    : ""
                  : "",
                rules: [
                  {
                    required: true,
                    message: "Please add a description to the item.",
                  },
                ],
              })(
                <TextArea
                  onBlur={(e) => this.itemDescriptionBlur(e, index)}
                  rows={2}
                ></TextArea>
              )}
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={10}>
            {isUpdating ? (
              <img
                src={items[index] !== undefined ? items[index].imageUrl : {}}
                style={{
                  borderRadius: "15px",
                  height: "100px",
                  width: "100px",
                }}
              />
            ) : (
              ""
            )}
          </Col>
          <Col span={14}>
            <Form.Item label="Service">
              {getFieldDecorator(`item[${index}].serviceType`, {
                validateTrigger: ["onChange"],
                initialValue: isUpdating
                  ? items[index] !== undefined
                    ? items[index].serviceType
                    : undefined
                  : undefined,
                rules: [
                  { required: true, message: "Please select a service." },
                ],
              })(
                <Select
                  placeholder="Select service"
                  size="large"
                  onChange={(e) => this.itemServiceChange(e, index)}
                >
                  {services.map((data, key) => (
                    <Option key={data} value={data.serviceName}>
                      {data.serviceName}
                    </Option>
                  ))}
                </Select>
              )}
            </Form.Item>
            {!hasGeneralPromo && (
              <Form.Item style={{ textAlign: "center" }}>
                {items[index] && !items[index].isSinglePromoCodeDisplayed && (
                  <Button
                    onClick={() => this.displayItemAddPromo(index)}
                    type="primary"
                    style={{ width: "100%" }}
                  >
                    <Icon type="plus" />
                    Add Promo Code for this Product
                  </Button>
                )}
              </Form.Item>
            )}
            {items[index] && items[index].isSinglePromoCodeDisplayed && (
              <Form.Item label="Promotion code">
                <div style={{ display: "flex" }}>
                  <div style={{ flex: "1", width: "90%" }}>
                    {getFieldDecorator(`item[${index}].promotionCode`, {
                      initialValue: isUpdating
                        ? items[index].singlePromoCode
                        : "",
                    })(
                      <Input
                        style={{
                          borderColor: `${
                            items[index].isValid ? "green" : "red"
                          }`,
                        }}
                        loading={items[index].isValidatingPromoCode}
                        onKeyUp={(e) =>
                          this.checkSinglePromoCode(e.target.value, index)
                        }
                        className="form-control"
                        placeholder="Enter promotion code"
                      />
                    )}
                  </div>
                  <div style={{ width: "10%" }}>
                    {items[index].isSinglePromoCodeDisplayed && (
                      <Button
                        onClick={() => this.displayItemAddPromo(index)}
                        style={{
                          backgroundColor: "#ff4d4f",
                          border: "1px solid #ff4d4f",
                          color: "#ffffff",
                          width: "100%",
                        }}
                      >
                        <Icon type="minus" />
                      </Button>
                    )}
                  </div>
                </div>
                {items[index].promoErrors &&
                  items[index].promoErrors.map((data) => (
                    <span className="error-message">{data}</span>
                  ))}
              </Form.Item>
            )}
          </Col>
        </Row>
      </div>
    ));

    const { tagColor, tagText } = OrderHelper.renderStatus(
      selectedOrder.status
    );

    return (
      <div>
        <div className="content-header">Orders</div>
        <div style={{ display: "flex", height: this.props.height - 130 }}>
          <div
            style={{
              position: "relative",
              flex: "1 0 25%",
              maxWidth: "420px",
              minWdith: "240px",
            }}
          >
            <div className="order-list-header">
              {/* <Button
                style={{ float: "left", zIndex: "10" }}
                onClick={this.openOrderModal}
              >
                <Icon type="plus" /> New Order
              </Button> */}
              <Button
                style={{ float: "right", zIndex: "10" }}
                onClick={this.refreshOrderList}
              >
                <Icon type="retweet" />
              </Button>
              <Form>
                <Form.Item style={{ marginBottom: "0" }}>
                  <Input
                    style={{ marginBottom: "0", width: "100%" }}
                    onKeyUp={(e) => this.searchOrders(e.target.value)}
                    placeholder="Search orders"
                    suffix={
                      <Tooltip title="Search criteria : Order ID, Address, Courier name, Customer name, Item description, Item service, Promotion code, Status">
                        <Icon
                          type="info-circle"
                          style={{ color: "rgba(0,0,0,.45)" }}
                        />
                      </Tooltip>
                    }
                  />
                </Form.Item>
              </Form>
            </div>
            <div className="order-list-body">
              {ordersLoading ? (
                <div style={{ marginTop: "200px", textAlign: "center" }}>
                  <Spin size="large" />
                </div>
              ) : orders.length === 0 ? (
                <p className="order-no-list">No order on the list.</p>
              ) : (
                <Scrollbars style={{ height: this.props.height - 240 }}>
                  {orders.map((data, key) => (
                    <OrderItem
                      key={key}
                      clearState={this.clearState}
                      loadOrders={this.loadOrders}
                      displayOrderDetails={this.displayOrderDetails}
                      order={data}
                    />
                  ))}
                </Scrollbars>
              )}
            </div>
            <div className="order-list-footer">
              <div style={{ textAlign: "left", flex: "1" }}>
                {hasPrev && (
                  <Button
                    disabled={ordersLoading}
                    onClick={this.prevPage}
                    icon="caret-left"
                    type="default"
                  ></Button>
                )}
              </div>
              <div style={{ textAlign: "center", flex: "1" }}>
                {orders && orders.length > 0 && (
                  <span
                    style={{
                      display: "block",
                      marginTop: "10px",
                      color: "#1b1b1b",
                    }}
                  >
                    Page {orderPage}
                  </span>
                )}
              </div>
              <div style={{ textAlign: "right", flex: "1" }}>
                {hasNext && (
                  <Button
                    style={{ float: "right" }}
                    disabled={ordersLoading}
                    onClick={this.nextPage}
                    icon="caret-right"
                    type="default"
                  ></Button>
                )}
              </div>
            </div>
          </div>
          <div style={{ flex: "1 1 0%" }}>
            <div
              style={{
                flex: "2 0 0%",
                overflow: "hidden",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                borderLeft: "1px solid #e4e4e4",
              }}
            >
              <div className="order-details-header">
                {Object.keys(selectedOrder).length === 0 ? (
                  ""
                ) : (
                  <div className="od-actions">
                    {/* <ButtonGroup>
                      <Button
                        onClick={this.updateOrder}
                        loading={isDeleting}
                        title="Update Order"
                        className="action-update"
                      >
                        <Icon type="edit" />
                      </Button>
                      <Button
                        onClick={this.openStatusModal}
                        loading={isDeleting}
                        title="Update Order Status"
                        className="action-update-status"
                      >
                        <Icon type="unordered-list" />
                      </Button>
                      <Popconfirm
                        title="Are you sure you want to remove this order?"
                        onConfirm={this.deleteOrder}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Button
                          loading={isDeleting}
                          title="Delete order"
                          className="action-delete"
                        >
                          <Icon type="delete" />
                        </Button>
                      </Popconfirm>
                    </ButtonGroup> */}
                  </div>
                )}
              </div>
              <div className="order-details-body">
                {Object.keys(selectedOrder).length === 0 ? (
                  <p className="no-selected-order">Please select an order</p>
                ) : (
                  <Scrollbars style={{ height: this.props.height - 190 }}>
                    <div className="order-details">
                      <div className="od-section">
                        <p className="od-section-header">Order Information</p>
                        <Row style={{ marginBottom: "10px" }}>
                          <Col span={8}>
                            <span className="od-label">ORDER ID</span>
                            <span className="od-value">
                              {selectedOrder.orderID
                                ? selectedOrder.orderID
                                : "N/A"}
                            </span>
                          </Col>
                          <Col span={16}>
                            <span className="od-label">STATUS</span>
                            <span className="od-value">
                              <Tag color={tagColor}>{tagText}</Tag>
                            </span>
                          </Col>
                        </Row>
                        <Row style={{ marginBottom: "10px" }}>
                          <Col span={8}>
                            <span className="od-label">CUSTOMER NAME</span>
                            <span className="od-value">
                              {selectedOrder.customerName}
                            </span>
                          </Col>
                          <Col span={8}>
                            <span className="od-label">CONTACT NUMBER</span>
                            <span className="od-value">
                              {selectedOrder.customerPhoneNumber
                                ? selectedOrder.customerPhoneNumber
                                : "N/A"}
                            </span>
                          </Col>
                          <Col span={8}>
                            <span className="od-label">COURIER NAME</span>
                            <span className="od-value">
                              {selectedOrder.courierName
                                ? selectedOrder.courierName
                                : "N/A"}
                            </span>
                          </Col>
                        </Row>
                        <Row style={{ marginBottom: "10px" }}>
                          <Col span={24}>
                            <span className="od-label">CUSTOMER ADDRESS</span>
                            <span className="od-value">
                              {selectedOrder.addressText}
                            </span>
                          </Col>
                        </Row>
                        <Row style={{ marginBottom: "10px" }}>
                          <Col span={8}>
                            <span className="od-label">PROMOTION CODE</span>
                            <span className="od-value">
                              {selectedOrder.promotionCode
                                ? selectedOrder.promotionCode
                                : "N/A"}
                            </span>
                          </Col>
                          <Col span={16}>
                            <span className="od-label">AMOUNT</span>
                            <span className="od-value">
                              Rp {selectedOrder.totalPrice}
                            </span>
                          </Col>
                        </Row>
                        <Row style={{ marginBottom: "10px" }}>
                          <Col span={24}>
                            <span className="od-label">NOTES</span>
                            <span className="od-value">
                              {selectedOrder.note
                                ? selectedOrder.note
                                : "No additional notes for this order."}
                            </span>
                          </Col>
                        </Row>
                        <Row style={{ marginBottom: "10px" }}>
                          <Col span={24}>
                            <span className="od-label">EXTRA TREATMENT</span>
                            <span className="od-value">
                              {selectedOrder.extraTreatment
                                ? selectedOrder.extraTreatment
                                : "No extra treatment for this order."}
                            </span>
                          </Col>
                        </Row>
                      </div>
                      <div className="od-section">
                        <p className="od-section-header">Items and Services</p>
                        {Object.keys(selectedOrder).length === 0 ? (
                          ""
                        ) : (
                          <ul className="od-item-list">
                            {selectedOrder.items.map((data, i) => (
                              <li key={i}>
                                <div className="od-item">
                                  <img
                                    alt={data.serviceType}
                                    onClick={() =>
                                      this.previewImage(data.imageUrl)
                                    }
                                    src={data.imageUrl}
                                  />
                                  <h3 className="od-item-service">
                                    {data.serviceType}
                                  </h3>
                                  <p className="od-item-desc">
                                    {data.description}
                                  </p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="od-section">
                        <p className="od-section-header">
                          Confirmation Pictures
                        </p>
                        {Object.keys(selectedOrder).length === 0 ? (
                          <p className="od-value">Payment not confirmed yet.</p>
                        ) : selectedOrder.pickupConfirmationPictures.length ===
                          0 ? (
                          <p className="od-value">Payment not confirmed yet.</p>
                        ) : (
                          <ul className="od-confirmpics-list">
                            {selectedOrder.pickupConfirmationPictures.map(
                              (data, i) => (
                                <li key={i}>
                                  <img
                                    alt="Confirmation Pictures"
                                    onClick={() => this.previewImage(data)}
                                    src={data}
                                  />
                                </li>
                              )
                            )}
                          </ul>
                        )}
                      </div>
                      <div className="od-section">
                        <p className="od-section-header">Order Timeline</p>
                        {Object.keys(selectedOrder).length === 0 ? (
                          <p className="od-value">
                            No activity to be displayed.
                          </p>
                        ) : selectedOrder.timeline.length === 0 ? (
                          <p className="od-value">
                            No activity to be displayed.
                          </p>
                        ) : (
                          <Timeline>
                            {selectedOrder.timeline.map((data, i) => (
                              <TimelineItem key={i} color="green">
                                <p
                                  style={{
                                    display: "block",
                                    fontSize: "16px",
                                    marginBottom: "5px",
                                  }}
                                >
                                  Order updated from{" "}
                                  <span style={{ fontWeight: "bold" }}>
                                    {data.from}
                                  </span>{" "}
                                  to{" "}
                                  <span style={{ fontWeight: "bold" }}>
                                    {data.to}
                                  </span>
                                </p>
                                <p style={{ fontSize: "15px" }}>
                                  {moment
                                    .unix(data.timestamp.seconds)
                                    .format("LLLL")}
                                </p>
                              </TimelineItem>
                            ))}
                          </Timeline>
                        )}
                      </div>
                    </div>
                  </Scrollbars>
                )}
              </div>
              <div className="order-details-footer"></div>
            </div>
          </div>
          {/* 
                            MODALS
                        */}
          {orderModalActive && (
            <Modal
              width={900}
              visible={orderModalActive}
              onClose={this.closeOrderModal}
              title={isUpdating ? "Update Order" : "New Order"}
              okText="Submit"
              onOk={this.saveOrder}
              onCancel={this.closeOrderModal}
              confirmLoading={isSaving}
              okButtonProps={{
                disabled: isSaving || isCheckingPromoCode ? true : false,
              }}
              cancelButtonProps={{ disabled: isSaving }}
              closable={false}
              maskClosable={false}
            >
              <Form>
                <Form.Item label="Customer">
                  {getFieldDecorator("customer", {
                    initialValue: isUpdating
                      ? selectedOrder.customerUid
                      : undefined,
                    rules: [
                      { required: true, message: "Please select a customer" },
                    ],
                  })(
                    <Select
                      placeholder="Select customer"
                      onSelect={(value, e) => this.customerChange(value, e)}
                      size="large"
                    >
                      {customers.map((data, key) => (
                        <Option key={key} value={data.uid}>
                          {data.fullName}
                        </Option>
                      ))}
                    </Select>
                  )}
                </Form.Item>
                <Form.Item label="Contact number">
                  {getFieldDecorator("customerPhoneNumber", {
                    initialValue: isUpdating
                      ? selectedOrder.customerPhoneNumber
                      : "",
                  })(
                    <Input
                      className="form-control"
                      placeholder="Enter contact number"
                    />
                  )}
                </Form.Item>
                <Form.Item label="Promotion code">
                  {getFieldDecorator("promotionCode", {
                    initialValue: isUpdating ? selectedOrder.promotionCode : "",
                  })(
                    <Input
                      disabled={hasSinglePromo}
                      onKeyUp={(e) =>
                        this.checkGeneralPromoCode(e.target.value)
                      }
                      className="form-control"
                      placeholder="Enter promotion code"
                    />
                  )}
                  {generalPromoErrors &&
                    generalPromoErrors.map((data) => (
                      <span className="error-message">{data}</span>
                    ))}
                </Form.Item>
                <Form.Item style={{ textAlign: "center" }}>
                  <Button
                    onClick={this.addItem}
                    type="primary"
                    style={{ width: "50%" }}
                  >
                    <Icon type="plus" /> Add item
                  </Button>
                </Form.Item>

                {formItems}

                <Form.Item label="Address">
                  <Row gutter={24} style={{ marginBottom: "10px" }}>
                    <Col span={18}>
                      <AutoComplete
                        customSearchOptions={{
                          types: ["geocode", "establishment"],
                        }}
                        setAddressFromAutocomplete={(
                          lng,
                          lat,
                          address,
                          addressComponents
                        ) =>
                          this.setAddressFromAutocomplete(
                            lng,
                            lat,
                            address,
                            addressComponents
                          )
                        }
                      ></AutoComplete>
                      {getFieldDecorator("addressText", {
                        rules: [
                          {
                            required: true,
                            message: "Please select a location",
                          },
                        ],
                      })(
                        <Input
                          style={{ display: "none" }}
                          autoComplete="off"
                          className="form-control"
                        />
                      )}
                    </Col>
                    <Col span={6}>
                      <Button
                        type="dashed"
                        style={{ width: "100%" }}
                        onClick={this.openMapModal}
                      >
                        Select from map
                      </Button>
                    </Col>
                  </Row>
                  <Row>
                    <Col span={24}>
                      <span className="order-address-display">
                        <Icon type="environment" /> &nbsp;&nbsp;{" "}
                        {rAddress !== "" ? rAddress : "No location seleted."}
                      </span>
                    </Col>
                  </Row>

                  {/* <Map
                                            google={this.props.google}
                                            center={{lat: mapLat, lng: mapLng}}
                                            height='300px'
                                            zoom={15}
                                            isDraggable={markerDraggable}
                                            setAddress={ (lng, lat, address, addressComponents) => this.setAddress(lng,lat,address, addressComponents) }
                                            displayType = {'(regions)'}
                                        /> */}
                </Form.Item>
                <Form.Item style={{ marginTop: "50px" }} label="Notes">
                  {getFieldDecorator("notes", {
                    initialValue: isUpdating ? selectedOrder.note : "",
                  })(
                    <TextArea
                      placeholder="Enter additional notes"
                      rows={3}
                    ></TextArea>
                  )}
                </Form.Item>
                <Form.Item
                  style={{ marginTop: "50px" }}
                  label="Extra Treatment"
                >
                  {getFieldDecorator("extraTreatment", {
                    initialValue: isUpdating
                      ? selectedOrder.extraTreatment
                      : "",
                  })(
                    <TextArea
                      placeholder="Enter extra treatment"
                      rows={3}
                    ></TextArea>
                  )}
                </Form.Item>
              </Form>
            </Modal>
          )}
          {mapModalActive && (
            <Modal
              width={600}
              visible={mapModalActive}
              onClose={this.closeMapModal}
              title="Select your location"
              okText="Ok"
              onOk={this.getMapResults}
              onCancel={this.closeMapModal}
              confirmLoading={isGettingMapLocation}
              okButtonProps={{ disabled: isGettingMapLocation }}
              cancelButtonProps={{ disabled: isGettingMapLocation }}
              closable={false}
              maskClosable={false}
              bodyStyle={{ height: "400px" }}
            >
              <Map
                google={this.props.google}
                center={{ lat: mapLat, lng: mapLng }}
                height="300px"
                zoom={15}
                isDraggable={true}
                setAddressFromMap={(lng, lat, address, addressComponents) =>
                  this.setAddressFromMap(lng, lat, address, addressComponents)
                }
                showAutoComplete={true}
              />
            </Modal>
          )}

          {viewImageModal && (
            <Modal
              visible={viewImageModal}
              footer={null}
              onCancel={() => this.previewImage("")}
            >
              <img style={{ width: "100%" }} src={previewImage} />
            </Modal>
          )}

          {statusModalActive && (
            <Modal
              visible={statusModalActive}
              onClose={this.closeStatusModal}
              title="Update Status"
              okText="Submit"
              onOk={this.saveOrderStatus}
              confirmLoading={isSaving}
              okButtonProps={{ disabled: isSaving }}
              cancelButtonProps={{ disabled: isSaving }}
              onCancel={this.closeStatusModal}
              closable={false}
              maskClosable={false}
            >
              <Form>
                <Form.Item label="Status">
                  {getFieldDecorator("upStatus", {
                    initialValue: selectedOrder.status,
                  })(
                    <Select
                      placeholder="Select status"
                      onChange={this.statusSelectChange}
                      size="large"
                      // style={{ width: '170px' }}
                    >
                      <Option value="waitingForPickup">
                        Waiting for pickup
                      </Option>
                      <Option value="onTheWay">On the way</Option>
                      <Option value="paidAndOnProgress">In Progress</Option>
                      <Option value="done">Done</Option>
                      <Option value="delivered">Paid & Delivered</Option>
                    </Select>
                  )}
                </Form.Item>
                {statusOnTheWay && (
                  <Form.Item label="Courier">
                    {getFieldDecorator("upCourier", {
                      rules: [
                        {
                          required: statusOnTheWay,
                          message: "Please select a courier",
                        },
                      ],
                    })(
                      <Select
                        placeholder="Select courier"
                        // onChange={this.courierSelectChange}
                        size="large"
                        // style={{ width: '170px' }}
                      >
                        {couriers.map((data, key) => (
                          <Option key={key} value={data.uid}>
                            {data.fullName}
                          </Option>
                        ))}
                      </Select>
                    )}
                  </Form.Item>
                )}
                {statusPaid && (
                  <Form.Item label="Confirmation Pictures">
                    {getFieldDecorator("confirmationPics", {
                      rules: [
                        {
                          required: statusPaid,
                          message: "Please upload confirmation pictures",
                        },
                      ],
                    })(
                      <Upload
                        accept="image/*"
                        onChange={this.onFileChange}
                        {...uploadProps}
                        fileList={this.state.updateStatusFileList}
                      >
                        <Button>
                          <Icon type="upload" /> Upload
                        </Button>
                      </Upload>
                    )}
                  </Form.Item>
                )}
              </Form>
            </Modal>
          )}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  ...state.Order,
  ...state.App,
});
const WrappedOrder = Form.create()(Order);
export default connect(mapStateToProps)(WrappedOrder);
