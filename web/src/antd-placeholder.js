/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

// Inert stand-in for the `antd` package.
//
// @lobehub/icons and its own dependencies (antd-style, @lobehub/ui,
// @lobehub/fluent-emoji) declare `antd` as an optional peer dependency and import
// components and hooks from it, even though this project never renders any of them -
// the UI is built on Semi Design. Installing the real antd purely to satisfy those
// dead code paths would add a large amount of unused weight to the bundle, so
// vite.config.js aliases `antd` to this module instead.
//
// Every export below is a no-op. The list is deliberately wider than what the current
// dependency tree asks for: a named import that is missing here becomes a hard Rollup
// error at build time ("X is not exported by src/antd-placeholder.js"), so exporting a
// few unused names is far cheaper than chasing each dependency's exact import list.

const noop = function () {
  return null;
};

const namespace = (names) => {
  const target = {};
  names.forEach((name) => {
    target[name] = noop;
  });
  return target;
};

const withParts = (parts) => {
  const component = noop;
  if (parts) {
    Object.keys(parts).forEach((key) => {
      component[key] = parts[key];
    });
  }
  return component;
};

const theme = {
  useToken: () => ({ token: {}, theme: {}, hashId: '' }),
  getDesignToken: () => ({}),
  defaultAlgorithm: {},
  darkAlgorithm: {},
  compactAlgorithm: {},
  defaultSeed: {},
};

const message = namespace([
  'success',
  'error',
  'info',
  'warning',
  'loading',
  'open',
  'destroy',
  'config',
]);
message.useMessage = () => [message, null];

const notification = namespace([
  'success',
  'error',
  'info',
  'warning',
  'open',
  'destroy',
  'config',
]);
notification.useNotification = () => [notification, null];

const version = '0.0.0-stub';

export const Affix = withParts();
export const Alert = withParts({ ErrorBoundary: noop });
export const Anchor = withParts({ Link: noop });
export const App = withParts({
  useApp: () => ({
    message,
    notification,
    modal: namespace([
      'confirm',
      'info',
      'success',
      'error',
      'warning',
      'destroyAll',
    ]),
  }),
});
export const AutoComplete = withParts({ Option: noop, OptGroup: noop });
export const Avatar = withParts({ Group: noop });
export const Badge = withParts({ Ribbon: noop });
export const Breadcrumb = withParts({ Item: noop, Separator: noop });
export const Button = withParts({ Group: noop });
export const Calendar = withParts();
export const Card = withParts({ Meta: noop, Grid: noop });
export const Carousel = withParts();
export const Cascader = withParts();
export const Checkbox = withParts({ Group: noop });
export const Col = withParts();
export const Collapse = withParts({ Panel: noop });
export const ColorPicker = withParts();
export const ConfigProvider = withParts({ config: noop, useConfig: () => ({}) });
export const DatePicker = withParts({
  RangePicker: noop,
  MonthPicker: noop,
  WeekPicker: noop,
  QuarterPicker: noop,
});
export const Descriptions = withParts({ Item: noop });
export const Divider = withParts();
export const Drawer = withParts();
export const Dropdown = withParts({ Button: noop });
export const Empty = withParts({
  PRESENTED_IMAGE_SIMPLE: null,
  PRESENTED_IMAGE_DEFAULT: null,
});
export const Flex = withParts();
export const FloatButton = withParts({ Group: noop, BackTop: noop });
export const Form = withParts({
  Item: noop,
  List: noop,
  ErrorList: noop,
  Provider: noop,
  create: () => ({}),
  useForm: () => [{}],
  useFormInstance: () => ({}),
  useWatch: () => undefined,
});
export const Grid = withParts({ Row: noop, Col: noop, useBreakpoint: () => ({}) });
export const Image = withParts({ PreviewGroup: noop });
export const Input = withParts({
  TextArea: noop,
  Search: noop,
  Group: noop,
  Password: noop,
  OTP: noop,
});
export const InputNumber = withParts();
export const Layout = withParts({
  Header: noop,
  Sider: noop,
  Content: noop,
  Footer: noop,
});
export const List = withParts({ Item: withParts({ Meta: noop }) });
export const Mentions = withParts({ Option: noop });
export const Menu = withParts({
  Item: noop,
  SubMenu: noop,
  ItemGroup: noop,
  Divider: noop,
});
export const Modal = withParts({
  confirm: noop,
  info: noop,
  success: noop,
  error: noop,
  warning: noop,
  destroyAll: noop,
  useModal: () => [{}, null],
});
export const Pagination = withParts();
export const Popconfirm = withParts();
export const Popover = withParts();
export const Progress = withParts();
export const QRCode = withParts();
export const Radio = withParts({ Group: noop, Button: noop });
export const Rate = withParts();
export const Result = withParts();
export const Row = withParts();
export const Segmented = withParts();
export const Select = withParts({ Option: noop, OptGroup: noop });
export const Skeleton = withParts({
  Avatar: noop,
  Button: noop,
  Input: noop,
  Image: noop,
  Node: noop,
});
export const Slider = withParts();
export const Space = withParts({ Compact: noop });
export const Spin = withParts({ setDefaultIndicator: noop });
export const Splitter = withParts({ Panel: noop });
export const Statistic = withParts({ Countdown: noop, Timer: noop });
export const Steps = withParts({ Step: noop });
export const Switch = withParts();
export const Table = withParts({
  Column: noop,
  ColumnGroup: noop,
  Summary: noop,
  SELECTION_ALL: 'SELECT_ALL',
  SELECTION_INVERT: 'SELECT_INVERT',
  SELECTION_NONE: 'SELECT_NONE',
});
export const Tabs = withParts({ TabPane: noop });
export const Tag = withParts({ CheckableTag: noop });
export const TimePicker = withParts({ RangePicker: noop });
export const Timeline = withParts({ Item: noop });
export const Tooltip = withParts();
export const Tour = withParts();
export const Transfer = withParts({ List: noop, Search: noop, Operation: noop });
export const Tree = withParts({ TreeNode: noop, DirectoryTree: noop });
export const TreeSelect = withParts({
  TreeNode: noop,
  SHOW_ALL: 'SHOW_ALL',
  SHOW_PARENT: 'SHOW_PARENT',
  SHOW_CHILD: 'SHOW_CHILD',
});
export const Typography = withParts({
  Title: noop,
  Text: noop,
  Paragraph: noop,
  Link: noop,
});
export const Upload = withParts({ Dragger: noop, List: noop });
export const Watermark = withParts();

// Legacy names that older dependency versions still reference.
export const BackTop = withParts();
export const Comment = withParts();
export const PageHeader = withParts();
export const LocaleProvider = withParts();

export { theme, message, notification, version };

const antd = {
  Affix,
  Alert,
  Anchor,
  App,
  AutoComplete,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Calendar,
  Card,
  Carousel,
  Cascader,
  Checkbox,
  Col,
  Collapse,
  ColorPicker,
  ConfigProvider,
  DatePicker,
  Descriptions,
  Divider,
  Drawer,
  Dropdown,
  Empty,
  Flex,
  FloatButton,
  Form,
  Grid,
  Image,
  Input,
  InputNumber,
  Layout,
  List,
  Mentions,
  Menu,
  Modal,
  Pagination,
  Popconfirm,
  Popover,
  Progress,
  QRCode,
  Radio,
  Rate,
  Result,
  Row,
  Segmented,
  Select,
  Skeleton,
  Slider,
  Space,
  Spin,
  Splitter,
  Statistic,
  Steps,
  Switch,
  Table,
  Tabs,
  Tag,
  TimePicker,
  Timeline,
  Tooltip,
  Tour,
  Transfer,
  Tree,
  TreeSelect,
  Typography,
  Upload,
  Watermark,
  BackTop,
  Comment,
  PageHeader,
  LocaleProvider,
  theme,
  message,
  notification,
  version,
};

export default antd;
