import React, { useRef } from "react";
import { IconClose, IconPrint } from "../../../../icon";
import ReactToPrint from "react-to-print";
import jsUcfirst from "../../../../../utils/jsUcfirst";
import formatCurrency from "../../../../../utils/formatCurrency";
import formatOrderStatus from "../../../../../utils/formatOrderStatus";
import formatTimestamp from "../../../../../utils/formatTimestamp";
import styles from "./styles.module.css";

export default function Bill({ close, data }) {
  const componentRef = useRef();
  return (
    <React.Fragment>
      <div onClick={close} className="bg-black/30 top-0 right-0 left-0 w-full h-full fixed z-20">
        <div
          className={`${styles.navbar} bg-white fixed w-[550px] flex flex-col h-[90%]   right-1/2 top-1/2 z-50 bg-opacity-100 opacity-100 translate-x-[50%] translate-y-[-50%] rounded-[10px]`}
        >
          <div className="flex justify-end">
            <div
              onClick={close}
              className="flex items-center w-[5%] h-[35px] text-left rounded-tr-[10px] bg-[#ee4d2d] text-[#fff]  text-[25px] cursor-pointer hover:bg-[#e8340c]"
            >
              <IconClose />
            </div>
          </div>
          <div ref={componentRef} className="w-full max-w-2xl mx-auto bg-white px-4 py-5">
            <div className="text-center mb-4">
              <h1 className="text-xl font-bold uppercase">Đơn hàng</h1>
              <p className="text-sm text-gray-500">Ngày: {formatTimestamp(data.createdAt)}</p>
            </div>
            <div className="flex justify-between mb-6">
              <div>
                <p className="my-1 text-sm">
                  <span className="font-bold">Mã đơn hàng: </span>
                  <span>{data._id}</span>
                </p>
                <p className="my-1 font-bold text-sm">Tên khách hàng: {data.deliveryAddress.name}</p>
                <p className="my-1 text-sm">
                  <span className="font-bold ">Số điện thoại:</span> {data.deliveryAddress.phone}
                </p>

                <p className="my-1 text-sm">
                  <span className="font-bold">Địa chỉ: </span>
                  <span>{`${data.deliveryAddress.addressDetail}, ${data.deliveryAddress.ward}, ${data.deliveryAddress.district}, ${data.deliveryAddress.province}`}</span>
                </p>
                <p className="my-1 text-sm">
                  <span className="font-bold">Tình trạng: </span> <span>{formatOrderStatus(data.status)}</span>{" "}
                </p>
                <p className="my-1 text-sm">
                  <span className="font-bold">Nhân viên xác nhận: </span>
                  <span>{data.staff ? data.staff.name : "Đang chờ"}</span>
                </p>
                <p className="my-1 text-sm">
                  <span className="font-bold">Phương thức thanh toán: </span>
                  <span>{data.paymentMethod === 1 ? "Thanh toán tiền mặt" : "Thanh toán online"}</span>
                </p>
              </div>
            </div>
            <div className="w-full overflow-hidden border border-gray-200 rounded-lg ring-1 ring-black ring-opacity-5 mb-8 rounded-b-lg">
              <div className="w-full">
                <table className="w-full whitespace-nowrap">
                  <thead className="text-xs divide-y divide-gray-10 divide-y-reverse font-semibold tracking-wide text-left text-gray-500 uppercase bg-gray-100">
                    <tr className="">
                      <td className="text-center py-2 ">
                        <div className="">Sản phẩm</div>
                      </td>
                      <td className="text-center py-2">
                        <div className="">Số lượng</div>
                      </td>
                      <td className="text-center py-2 px-3">
                        <div className="">Đơn giá</div>
                      </td>
                      <td className="text-right py-2 pr-3">
                        <div className="">Thành tiền</div>
                      </td>
                    </tr>
                    <tr></tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-10 text-gray-700">
                    {data.orderDetail.map((item, index) => (
                      <tr key={index}>
                        <td className="pl-3">
                          <p className="text-sm">{jsUcfirst(item.name)}</p>
                        </td>
                        <td className="text-sm text-center">
                          <span>{item.quantity}</span>
                        </td>
                        <td className="text-sm text-center font-medium ">
                          <p style={item.percentageDiscount !== 0 ? { textDecoration: "line-through" } : null}>
                            {formatCurrency(item.price)}
                          </p>
                          {item.percentageDiscount !== 0 && (
                            <p className="text-sm text-center font-medium ">
                              {formatCurrency(item.price - item.price * item.percentageDiscount)}
                            </p>
                          )}
                        </td>
                        <td className="bg-white text-[red] font-normal  divide-y py-2 pr-3 text-right text-sm divide-gray-10 ">
                          {formatCurrency(
                            item?.quantity *
                              (item?.product?.price - item?.product?.price * item?.product?.percentageDiscount),
                          )}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={3} className="text-left pl-3 py-2 text-sm font-semibold">
                        Tiền vận chuyển
                      </td>
                      <td className="bg-white divide-y py-2 pr-3 text-right text-sm divide-gray-10 text-[red] font-semibold">
                        {formatCurrency(0)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="text-left pl-3 py-2 text-sm font-semibold">
                        Tổng tiền
                      </td>
                      <td className="bg-white divide-y py-2 pr-3 text-right text-sm divide-gray-10 text-[red] font-semibold">
                        {formatCurrency(data.orderTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <ReactToPrint
            content={() => componentRef.current}
            trigger={() => {
              return (
                <div className="flex justify-center mb-5">
                  <button className="flex items-center gap-x-2 text-white bg-primary px-8 py-2 rounded-md">
                    <IconPrint />
                    <span>In</span>
                  </button>
                </div>
              );
            }}
          />
        </div>
      </div>
    </React.Fragment>
  );
}
