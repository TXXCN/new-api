# CI debug report

commit: a6d43324706f8c49c32feb5f8af8eab85ce8b7ee
date: 2026-09-19T06:46:19Z

## bun install
```
bun: 1.3.11
--- bun install ---
bun install v1.3.11 (af24e281)
2 |   "lockfileVersion": 2,
                         ^
error: Unknown lockfile version
    at bun.lock:2:22
UnknownLockfileVersion: failed to parse lockfile: 'bun.lock'

warn: Ignoring lockfile
Resolving dependencies
Resolved, downloaded and extracted [3960]
warn: incorrect peer dependency "react@18.3.1"

warn: incorrect peer dependency "react-dom@18.3.1"

warn: incorrect peer dependency "react@18.3.1"

warn: incorrect peer dependency "react@18.3.1"

warn: incorrect peer dependency "react-dom@18.3.1"

warn: incorrect peer dependency "vite@5.4.21"

warn: incorrect peer dependency "react@18.3.1"

warn: incorrect peer dependency "react-dom@18.3.1"

warn: incorrect peer dependency "antd@5.29.3"
Saved lockfile

+ @douyinfe/vite-plugin-semi@2.74.0-alpha.6
+ @so1ve/prettier-config@3.26.0 (v4.7.0 available)
+ @vitejs/plugin-react@4.7.0 (v6.1.1 available)
+ autoprefixer@10.6.1
+ code-inspector-plugin@1.6.6 (v2.0.9 available)
+ eslint@8.57.0 (v10.11.0 available)
+ eslint-plugin-header@3.1.1
+ eslint-plugin-react-hooks@5.2.0 (v7.1.1 available)
+ i18next-cli@1.74.1
+ postcss@8.5.28
+ prettier@3.9.8
+ tailwindcss@3.4.19 (v4.3.3 available)
+ typescript@4.4.2 (v7.0.2 available)
+ vite@5.4.21 (v8.3.0 available)
+ @douyinfe/semi-icons@2.69.1 (v2.103.0 available)
+ @douyinfe/semi-ui@2.69.1 (v2.103.0 available)
+ @lobehub/icons@2.47.0 (v5.18.0 available)
+ @visactor/react-vchart@1.8.11 (v2.1.7 available)
+ @visactor/vchart@1.8.11 (v2.1.7 available)
+ @visactor/vchart-semi-theme@1.8.8 (v1.13.1 available)
+ axios@1.15.0 (v1.20.0 available)
+ clsx@2.1.1
+ dayjs@1.11.23
+ history@5.3.0
+ i18next@23.16.8 (v26.4.2 available)
+ i18next-browser-languagedetector@7.2.2 (v8.2.1 available)
+ katex@0.16.47 (v0.18.7 available)
+ lucide-react@0.511.0 (v1.47.0 available)
+ marked@4.3.0 (v18.0.13 available)
+ mermaid@11.17.2 (v12.0.0 available)
+ qrcode.react@4.2.0
+ react@18.3.1 (v19.3.0 available)
+ react-dom@18.3.1 (v19.3.0 available)
+ react-dropzone@14.4.1 (v20.1.2 available)
+ react-fireworks@1.0.4
+ react-i18next@13.5.0 (v17.0.14 available)
+ react-icons@5.7.0
+ react-markdown@10.1.0
+ react-router-dom@6.30.6 (v7.18.4 available)
+ react-telegram-login@1.1.2
+ react-toastify@9.1.3 (v11.1.0 available)
+ react-turnstile@1.1.5
+ rehype-highlight@7.0.2
+ rehype-katex@7.0.1
+ remark-breaks@4.0.0
+ remark-gfm@4.0.1
+ remark-math@6.0.0
+ sse.js@2.8.0
+ unist-util-visit@5.1.0
+ use-debounce@10.1.1

987 packages installed [6.48s]

Blocked 2 postinstalls. Run `bun pm untrusted` for details.
install_rc=0
```

## antd audit
```
=== resolved versions (as CI resolved them) ===
@lobehub/ui = 2.25.0
@lobehub/icons = 2.47.0
antd-style = 3.7.1
@lobehub/fluent-emoji = 2.0.0
antd = 5.29.3
vite = 5.4.21

=== union of names imported from antd ===
Alert
Anchor
App
AutoComplete
Avatar
Button
Collapse
ColorPicker
ConfigProvider
DatePicker
Divider
Drawer
Dropdown
Empty
Form
Grid
Image
Input
InputNumber
Menu
Modal
Popover
Segmented
Select
Skeleton
Slider
Space
Tabs
Tag
Tooltip
Typography
Upload
message
notification
theme
version

=== files importing antd ===
node_modules/antd-style/es/hooks/useResponsive.js
node_modules/antd-style/es/hooks/useAntdToken.js
node_modules/antd-style/es/functions/extractStaticStyle.js
node_modules/antd-style/es/factories/createThemeProvider/AntdProvider.js
node_modules/antd-style/es/factories/createUseTheme.js
node_modules/@lobehub/ui/es/EmojiPicker/AvatarUploader.js
node_modules/@lobehub/ui/es/EmojiPicker/EmojiPicker.js
node_modules/@lobehub/ui/es/Empty/Empty.js
node_modules/@lobehub/ui/es/Tabs/Tabs.js
node_modules/@lobehub/ui/es/DatePicker/DatePicker.js
node_modules/@lobehub/ui/es/AutoComplete/Select.js
node_modules/@lobehub/ui/es/Alert/Alert.js
node_modules/@lobehub/ui/es/Input/Input.js
node_modules/@lobehub/ui/es/Input/InputOPT.js
node_modules/@lobehub/ui/es/Input/InputPassword.js
node_modules/@lobehub/ui/es/Input/InputNumber.js
node_modules/@lobehub/ui/es/Input/TextArea.js
node_modules/@lobehub/ui/es/DraggablePanel/DraggablePanel.js
node_modules/@lobehub/ui/es/SliderWithInput/SliderWithInput.js
node_modules/@lobehub/ui/es/awesome/Hero/Hero.js
node_modules/@lobehub/ui/es/ColorSwatches/ColorSwatches.js
node_modules/@lobehub/ui/es/Tag/Tag.js
node_modules/@lobehub/ui/es/Video/index.js
node_modules/@lobehub/ui/es/Button/Button.js
node_modules/@lobehub/ui/es/Avatar/Avatar.js
node_modules/@lobehub/ui/es/Menu/Menu.js
node_modules/@lobehub/ui/es/Form/Form.js
node_modules/@lobehub/ui/es/Form/index.js
node_modules/@lobehub/ui/es/Form/components/FormDivider.js
node_modules/@lobehub/ui/es/Form/components/FormSubmitFooter.js
node_modules/@lobehub/ui/es/Form/components/FormItem.js
node_modules/@lobehub/ui/es/chat/ChatList/components/ChatListItem.js
node_modules/@lobehub/ui/es/chat/ChatList/components/HistoryDivider.js
node_modules/@lobehub/ui/es/Segmented/Segmented.js
node_modules/@lobehub/ui/es/Drawer/Drawer.js
node_modules/@lobehub/ui/es/ThemeProvider/ConfigProvider.js
node_modules/@lobehub/ui/es/ThemeProvider/ThemeProvider.js
node_modules/@lobehub/ui/es/Collapse/Collapse.js
node_modules/@lobehub/ui/es/Toc/Toc.js
node_modules/@lobehub/ui/es/Toc/TocMobile.js
node_modules/@lobehub/ui/es/color/ColorScales/index.js
node_modules/@lobehub/ui/es/color/ColorScales/ScaleRow.js
node_modules/@lobehub/ui/es/Burger/Burger.js
node_modules/@lobehub/ui/es/Modal/Modal.js
node_modules/@lobehub/ui/es/Dropdown/Dropdown.js
node_modules/@lobehub/ui/es/Image/Image.js
node_modules/@lobehub/ui/es/Image/PreviewGroup.js
node_modules/@lobehub/ui/es/Accordion/Accordion.js
node_modules/@lobehub/ui/es/Tooltip/Tooltip.js
node_modules/@lobehub/ui/es/ThemeSwitch/ThemeSwitch.js
node_modules/@lobehub/ui/es/Select/Select.js
node_modules/@lobehub/ui/es/Highlighter/LangSelect.js
node_modules/@lobehub/ui/es/mdx/mdxComponents/Citation/PopoverPanel.js
node_modules/@lobehub/icons/es/features/ProviderCombine/Combine.js
node_modules/@lobehub/icons/es/components/Dashboard/index.js
node_modules/@lobehub/fluent-emoji/es/components/Dashboard.js
node_modules/@lobehub/fluent-emoji/es/components/EmojiItem.js

=== raw import lines ===
import { Alert as AntdAlert } from 'antd';
import { Anchor } from 'antd';
import { Anchor, Collapse, ConfigProvider } from 'antd';
import { App } from 'antd';
import { AutoComplete as AntAutoComplete } from 'antd';
import { Avatar as AntAvatar } from 'antd';
import { Button as AntdButton } from 'antd';
import { Collapse as AntdCollapse, ConfigProvider } from 'antd';
import { ColorPicker } from 'antd';
import { ConfigProvider as AntdConfigProvider } from 'antd';
import { ConfigProvider } from 'antd';
import { ConfigProvider, message, Modal, notification, theme } from 'antd';
import { DatePicker as AntDatePicker } from 'antd';
import { Divider as AntDivider } from 'antd';
import { Divider } from 'antd';
import { Drawer as AntdDrawer } from 'antd';
import { Drawer, Menu } from 'antd';
import { Dropdown as AntdDropdown } from 'antd';
import { Empty as AntEmpty } from 'antd';
import { Empty, Segmented } from 'antd';
import { Form as AntForm } from 'antd';
import { Form } from 'antd';
import { Grid } from 'antd';
import { Image as AntImage, Skeleton } from 'antd';
import { Image } from 'antd';
import { Input as AntInput } from 'antd';
import { InputNumber as AntInputNumber } from 'antd';
import { Menu as AntdMenu, ConfigProvider } from 'antd';
import { Modal as AntModal, Button, ConfigProvider, Drawer } from 'antd';
import { Popover } from 'antd';
import { Segmented as AntdSegmented } from 'antd';
import { Segmented } from 'antd';
import { Select as AntSelect } from 'antd';
import { Select } from 'antd';
import { Skeleton } from 'antd';
import { Slider } from 'antd';
import { Space } from 'antd';
import { Space, message } from 'antd';
import { Tabs as AntdTabs } from 'antd';
import { Tag as AntTag } from 'antd';
import { Tooltip as AntdTooltip } from 'antd';
import { Typography } from 'antd';
import { Upload, message } from 'antd';
import { theme } from 'antd';
import { version } from 'antd';
```

## frontend build
```
$ vite build
[36mvite v5.4.21 [32mbuilding for production...[36m[39m
transforming...
[32m✓[39m 16115 modules transformed.
[31mx[39m Build failed in 23.85s
[31merror during build:
[31msrc/helpers/render.jsx (104:2): "SiLinkedin" is not exported by "node_modules/react-icons/si/index.mjs", imported by "src/helpers/render.jsx".[31m
file: [36m/home/runner/work/new-api/new-api/web/src/helpers/render.jsx:104:2[31m
[33m
102:   SiGoogle,
103:   SiKeycloak,
104:   SiLinkedin,
       ^
105:   SiNextcloud,
106:   SiNotion,
[31m
    at getRollupError (file:///home/runner/work/new-api/new-api/web/node_modules/rollup/dist/es/shared/parseAst.js:319:41)
    at error (file:///home/runner/work/new-api/new-api/web/node_modules/rollup/dist/es/shared/parseAst.js:315:42)
    at Module.error (file:///home/runner/work/new-api/new-api/web/node_modules/rollup/dist/es/shared/node-entry.js:17671:16)
    at Module.traceVariable (file:///home/runner/work/new-api/new-api/web/node_modules/rollup/dist/es/shared/node-entry.js:18104:29)
    at ModuleScope.findVariable (file:///home/runner/work/new-api/new-api/web/node_modules/rollup/dist/es/shared/node-entry.js:15694:39)
    at Identifier.bind (file:///home/runner/work/new-api/new-api/web/node_modules/rollup/dist/es/shared/node-entry.js:5654:40)
    at Property.bind (file:///home/runner/work/new-api/new-api/web/node_modules/rollup/dist/es/shared/node-entry.js:3036:23)
    at ObjectExpression.bind (file:///home/runner/work/new-api/new-api/web/node_modules/rollup/dist/es/shared/node-entry.js:3032:28)
    at VariableDeclarator.bind (file:///home/runner/work/new-api/new-api/web/node_modules/rollup/dist/es/shared/node-entry.js:3036:23)
    at VariableDeclaration.bind (file:///home/runner/work/new-api/new-api/web/node_modules/rollup/dist/es/shared/node-entry.js:3032:28)[39m
error: script "build" exited with code 1
```
