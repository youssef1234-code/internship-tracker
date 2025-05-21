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
exports.badgeVariants = void 0;
exports.Badge = Badge;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_slot_1 = require("@radix-ui/react-slot");
var class_variance_authority_1 = require("class-variance-authority");
var utils_1 = require("@/lib/utils");
var badgeVariants = (0, class_variance_authority_1.cva)("inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-[3px] transition-[color,box-shadow] overflow-hidden border", {
    variants: {
        variant: {
            default: "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
            secondary: "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
            success: "border-[#00BA34] bg-[rgba(0,186,52,0.2)] text-[#00BA34]",
            warning: "border-[#FF9F2D] bg-[rgba(255,159,45,0.2)] text-[#FF9F2D]",
            destructive: "border-[#E92C2C] bg-[rgba(233,44,44,0.2)] text-[#E92C2C]",
            outline: "border border-input text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        },
    },
    defaultVariants: {
        variant: "default",
    },
});
exports.badgeVariants = badgeVariants;
function Badge(_a) {
    var className = _a.className, variant = _a.variant, _b = _a.asChild, asChild = _b === void 0 ? false : _b, props = __rest(_a, ["className", "variant", "asChild"]);
    var Comp = asChild ? react_slot_1.Slot : "span";
    return ((0, jsx_runtime_1.jsx)(Comp, __assign({ "data-slot": "badge", className: (0, utils_1.cn)(badgeVariants({ variant: variant }), className) }, props)));
}
