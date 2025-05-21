"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertDialog = AlertDialog;
exports.AlertDialogPortal = AlertDialogPortal;
exports.AlertDialogOverlay = AlertDialogOverlay;
exports.AlertDialogTrigger = AlertDialogTrigger;
exports.AlertDialogContent = AlertDialogContent;
exports.AlertDialogHeader = AlertDialogHeader;
exports.AlertDialogFooter = AlertDialogFooter;
exports.AlertDialogTitle = AlertDialogTitle;
exports.AlertDialogDescription = AlertDialogDescription;
exports.AlertDialogAction = AlertDialogAction;
exports.AlertDialogCancel = AlertDialogCancel;
var jsx_runtime_1 = require("react/jsx-runtime");
var AlertDialogPrimitive = __importStar(require("@radix-ui/react-alert-dialog"));
var utils_1 = require("@/lib/utils");
var button_1 = require("@/components/ui/button");
function AlertDialog(_a) {
    var props = __rest(_a, []);
    return (0, jsx_runtime_1.jsx)(AlertDialogPrimitive.Root, __assign({ "data-slot": "alert-dialog" }, props));
}
function AlertDialogTrigger(_a) {
    var props = __rest(_a, []);
    return ((0, jsx_runtime_1.jsx)(AlertDialogPrimitive.Trigger, __assign({ "data-slot": "alert-dialog-trigger" }, props)));
}
function AlertDialogPortal(_a) {
    var props = __rest(_a, []);
    return ((0, jsx_runtime_1.jsx)(AlertDialogPrimitive.Portal, __assign({ "data-slot": "alert-dialog-portal" }, props)));
}
function AlertDialogOverlay(_a) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return ((0, jsx_runtime_1.jsx)(AlertDialogPrimitive.Overlay, __assign({ "data-slot": "alert-dialog-overlay", className: (0, utils_1.cn)("data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50", className) }, props)));
}
function AlertDialogContent(_a) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return ((0, jsx_runtime_1.jsxs)(AlertDialogPortal, { children: [(0, jsx_runtime_1.jsx)(AlertDialogOverlay, {}), (0, jsx_runtime_1.jsx)(AlertDialogPrimitive.Content, __assign({ "data-slot": "alert-dialog-content", className: (0, utils_1.cn)("bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg", className) }, props))] }));
}
function AlertDialogHeader(_a) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return ((0, jsx_runtime_1.jsx)("div", __assign({ "data-slot": "alert-dialog-header", className: (0, utils_1.cn)("flex flex-col gap-2 text-center sm:text-left", className) }, props)));
}
function AlertDialogFooter(_a) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return ((0, jsx_runtime_1.jsx)("div", __assign({ "data-slot": "alert-dialog-footer", className: (0, utils_1.cn)("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className) }, props)));
}
function AlertDialogTitle(_a) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return ((0, jsx_runtime_1.jsx)(AlertDialogPrimitive.Title, __assign({ "data-slot": "alert-dialog-title", className: (0, utils_1.cn)("text-lg font-semibold", className) }, props)));
}
function AlertDialogDescription(_a) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return ((0, jsx_runtime_1.jsx)(AlertDialogPrimitive.Description, __assign({ "data-slot": "alert-dialog-description", className: (0, utils_1.cn)("text-muted-foreground text-sm", className) }, props)));
}
function AlertDialogAction(_a) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return ((0, jsx_runtime_1.jsx)(AlertDialogPrimitive.Action, __assign({ className: (0, utils_1.cn)((0, button_1.buttonVariants)(), className) }, props)));
}
function AlertDialogCancel(_a) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return ((0, jsx_runtime_1.jsx)(AlertDialogPrimitive.Cancel, __assign({ className: (0, utils_1.cn)((0, button_1.buttonVariants)({ variant: "outline" }), className) }, props)));
}
