import { Tooltip } from "react-tooltip";
import { IconEdit, IconDelete } from "../../icon";
import DataTable from "../../DataTable";
import jsUcfirst from "../../../utils/jsUcfirst";
import formatTimestamp from "../../../utils/formatTimestamp";
import Swal from "sweetalert2";

export default function CategoryTable({
  categories,
  handleSoftDelete,
  handleShowEditCategoryModal,
  isSelectAll,
  isSelected,
  handleSelectAll,
  handleSelected,
  currentPage,
  setCurrentPage,
  totalPageCount,
  limitPerPage,
  setLimitPerPage,
}) {
  const columnData = [
    {
      field: "name",
      headerName: "Tên danh mục",
      customClassName: "text-center",
      renderCell: (item) => {
        return <p className="text-sm text-center">{jsUcfirst(item.name)}</p>;
      },
    },
    {
      field: "createdAt",
      headerName: "Ngày thêm",
      customClassName: "text-center",
      renderCell: (item) => {
        return <p className="text-sm text-center">{formatTimestamp(item.createdAt)}</p>;
      },
    },
    {
      field: "updatedAt",
      headerName: "Ngày sửa đổi",
      customClassName: "text-center",
      renderCell: (item) => {
        return <p className="text-sm text-center">{formatTimestamp(item.updatedAt)}</p>;
      },
    },
    {
      field: "actions",
      headerName: "Thao tác",
      customClassName: "text-center",
      renderCell: (item) => {
        return (
          <div className="flex justify-center items-center text-gray-400 gap-x-4">
            <button
              onClick={() => handleShowEditCategoryModal(item)}
              data-tooltip-id="edit"
              data-tooltip-content="Chỉnh sửa"
              className="hover:text-green-600"
            >
              <IconEdit />
            </button>
            <Tooltip id="edit" style={{ backgroundColor: "var(--color-primary" }} />
            <button
              onClick={() => {
                Swal.fire({
                  title: "Bạn chắc chắn muốn xoá?",
                  text: "Các sản phẩm thuộc danh mục này cũng sẽ bị chuyển vào thùng rác.",
                  icon: "question",
                  showCancelButton: true,
                  confirmButtonColor: "#0E9F6E",
                  cancelButtonColor: "#d33",
                  cancelButtonText: "Huỷ bỏ",
                  confirmButtonText: "Đồng ý!",
                }).then((result) => {
                  if (result.isConfirmed) {
                    handleSoftDelete(item._id);
                    Swal.fire({
                      title: "Đã chuyển vào thùng rác",
                      text: "Danh mục đã được chuyển vào thùng rác.",
                      confirmButtonColor: "#0E9F6E",
                    });
                  }
                });
              }}
              data-tooltip-id="delete"
              data-tooltip-content="Xoá"
              className="hover:text-red-600"
            >
              <IconDelete />
            </button>
            <Tooltip id="delete" style={{ backgroundColor: "#EF4444" }} />
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columnData={columnData}
      rowData={categories}
      select
      isSelectAll={isSelectAll}
      isSelected={isSelected}
      handleSelected={handleSelected}
      handleSelectAll={handleSelectAll}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      totalPageCount={totalPageCount}
      limitPerPage={limitPerPage}
      setLimitPerPage={setLimitPerPage}
    />
  );
}
