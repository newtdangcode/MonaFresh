const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const sendToken = require("../utils/sendToken");
const sendEmail = require("../utils/email");
const Cart = require("../models/cartModel");

const filterObject = (object, ...allowFields) => {
    const newObject = {};
    Object.keys(object).forEach((el) => {
        if (allowFields.includes(el)) {
            newObject[el] = object[el];
        }
    });
    return newObject;
};

const signAccessToken = (_id, role) => {
    return jwt.sign({ _id, role }, process.env.ACCESS_TOKEN_SECRET_KEY, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
    });
};

const signRefreshToken = (_id, role) => {
    return jwt.sign({ _id, role }, process.env.REFRESH_TOKEN_SECRET_KEY, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
    });
};

exports.signup = catchAsync(async (req, res) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
    });
    await Cart.create({
        customer: newUser._id,
        items: [],
    });
    newUser.password = undefined;
    res.status(201).json({
        status: "success",
        data: {
            user: newUser,
        },
    });
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new AppError("Vui lòng nhập email và mật khẩu", 400));
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError("Đăng nhập không thành công Email hoặc mật khẩu không đúng", 401));
    }
    sendToken(res, {
        name: "accessToken",
        token: signAccessToken(user._id, user.role),
        maxAge: 24 * 60 * 60 * 1000,
    });
    sendToken(res, {
        name: "refreshToken",
        token: signRefreshToken(user._id, user.role),
        maxAge: 90 * 24 * 60 * 60 * 1000,
    });
    user.password = undefined;
    res.status(200).json({
        status: "success",
        data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            photo: user.photo,
            phone: user.phone,
        },
    });
});

exports.checkLogin = catchAsync(async (req, res, next) => {
    const { accessToken } = req.cookies;
    if (!accessToken) {
        return next(new AppError("Bạn chưa đăng nhập. Vui lòng đăng nhập để truy cập", 401));
    }

    const decoded = await jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET_KEY);
    const user = await User.findById(decoded._id);
    res.status(200).json({
        status: "success",
        data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            photo: user.photo,
            phone: user.phone,
        },
    });
});

exports.getNewAccessToken = catchAsync(async (req, res, next) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
        return next(new AppError("Bạn chưa đăng nhập. Vui lòng đăng nhập để truy cập", 401));
    }
    const decoded = await jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET_KEY);
    sendToken(res, {
        name: "accessToken",
        token: signAccessToken(decoded._id, decoded.role),
        maxAge: 24 * 60 * 60 * 1000,
    });
    res.status(200).json({
        status: "success",
        data: null,
    });
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    if (!email) {
        return next(new AppError("Vui lòng điền Email của bạn", 400));
    }

    const user = await User.findOne({ email });
    if (!user) {
        return next(new AppError("Email không tồn tại", 404));
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${req.headers.origin}/reset-password/${resetToken}`;
    const message = `Mật khẩu của bạn có thể được đặt lại bằng click vào đường dẫn này: ${resetURL} .Đường dẫn sẽ có hiệu lực trong 10 phút. Nếu bạn không yêu cầu đặt lại mật khẩu vui lòng bỏ qua email này`;
    try {
        await sendEmail({
            to: email,
            subject: "Đặt lại mật khẩu của bạn(hiệu lực trong 10 phút)",
            message,
        });
        res.status(200).json({
            status: "success",
            message: "Một email đặt lại mật khẩu đã được gửi tới địa chỉ email của bạn",
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new AppError("Xảy ra lỗi trong quá trình gửi email. Hãy thử lại sau", 500));
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) {
        return next(new AppError("Đường dẫn không hợp lệ hoặc đã hết hạn", 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.status(200).json({
        status: "success",
        message: "Mật khẩu được cập nhật thành công",
    });
});

exports.getStatusResetPasswordToken = catchAsync(async (req, res, next) => {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) {
        return next(new AppError("Đường dẫn không hợp lệ hoặc đã hết hạn", 400));
    }
    res.status(200).json({
        status: "success",
        message: "Đường dẫn còn hiệu lực",
    });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    const { currentPassword } = req.body;
    if (!currentPassword) {
        return next(new AppError("Vui lòng nhập mật khẩu hiện tại", 400));
    }
    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.correctPassword(currentPassword, user.password))) {
        return next(new AppError("Mật khẩu hiện tại không đúng, vui lòng thử lại", 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    res.status(200).json({
        status: "success",
        message: "Mật khẩu được cập nhật thành công",
    });
});

exports.updateMe = catchAsync(async (req, res, next) => {
    const filterBody = filterObject(req.body, "name", "email", "phone", "photo");
    const updateUser = await User.findByIdAndUpdate(req.user._id, filterBody, {
        new: true,
        runValidators: true,
    });
    res.status(200).json({
        status: "success",
        data: {
            _id: updateUser._id,
            name: updateUser.name,
            email: updateUser.email,
            role: updateUser.role,
            photo: updateUser.photo,
            phone: updateUser.phone,
        },
    });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user._id, { isActive: false });
    res.status(204).json({
        status: "success",
        data: null,
    });
});

exports.logout = (req, res, next) => {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(200).json({
        status: "success",
        data: null,
    });
};
