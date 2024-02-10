try{
(()=>{var g=__STORYBOOK_API__,{ActiveTabs:f,Consumer:S,ManagerContext:_,Provider:j,addons:s,combineParameters:T,controlOrMetaKey:v,controlOrMetaSymbol:O,eventMatchesShortcut:x,eventToShortcut:M,isMacLike:A,isShortcutTaken:P,keyToSymbol:w,merge:C,mockChannel:B,optionOrAltSymbol:G,shortcutMatchesShortcut:I,shortcutToHumanString:K,types:R,useAddonState:H,useArgTypes:N,useArgs:Y,useChannel:E,useGlobalTypes:z,useGlobals:D,useParameter:J,useSharedState:L,useStoryPrepared:V,useStorybookApi:q,useStorybookState:U}=__STORYBOOK_API__;var Z=__STORYBOOK_THEMING__,{CacheProvider:$,ClassNames:ee,Global:te,ThemeProvider:oe,background:se,color:re,convert:ie,create:r,createCache:ne,createGlobal:ae,createReset:ce,css:le,darken:pe,ensure:de,ignoreSsrWarning:ue,isPropValid:me,jsx:be,keyframes:ke,lighten:he,styled:ye,themes:ge,typography:fe,useTheme:Se,withTheme:_e}=__STORYBOOK_THEMING__;var i={name:"lockblocks",version:"1.1.10",coreVersion:"3.0.9",author:"Justin Mahar <contact@justinmahar.com>",description:"Node.js utility for updating projects created from starters.",homepage:"https://justinmahar.github.io/lockblocks/",main:"./dist/main.js",bin:{lockblocks:"./bin/index.js"},types:"./dist/index.d.ts",scripts:{build:"rm -rf ./dist && tsc",test:"jest",start:"npm run storybook",storybook:"storybook dev -p 6006","build-storybook":"storybook build",preship:'npm run build && git diff-index HEAD && npm version patch -m "Build, version, and publish."',ship:"npm publish --access public",postship:"git push",update:"rm -rf .lockblocks && git clone -q git@github.com:justinmahar/react-kindling.git ./.lockblocks && lockblocks ./.lockblocks . --verbose && rm -rf .lockblocks && echo '' && echo ' \u2192 Be sure to run `npm i` to install new dependencies.' && echo ''",postupdate:"node remove-peer-deps.js"},license:"MIT",repository:{type:"git",url:"git+https://github.com/justinmahar/lockblocks.git"},bugs:{url:"https://github.com/justinmahar/lockblocks/issues"},keywords:["starter","template","update","updater","synchronize","synchronization","dependency","dependencies","maintenance","lock blocks"],dependencies:{"dir-compare":"^4.0.0","fs-extra":"^10.0.0",istextorbinary:"^6.0.0","json-format":"^1.0.1",jsonfile:"^6.1.0","read-yaml":"^1.1.0","replace-in-file":"^6.3.2","write-yaml-file":"^4.2.0"},devDependencies:{"@storybook/addon-docs":"^7.6.12","@storybook/addon-essentials":"^7.6.12","@storybook/addon-viewport":"^7.6.12","@storybook/blocks":"^7.6.12","@storybook/react":"^7.6.12","@storybook/react-webpack5":"^7.6.12","@types/fs-extra":"^9.0.13","@types/jest":"^29.5.12","@types/jsonfile":"^6.0.1","@types/react":"^18.2.53","@typescript-eslint/eslint-plugin":"^6.20.0","@typescript-eslint/parser":"^6.20.0",eslint:"^8.56.0","eslint-config-prettier":"^9.1.0","eslint-plugin-prettier":"^5.1.3","eslint-plugin-react":"^7.33.2","eslint-plugin-react-hooks":"^4.6.0","eslint-plugin-storybook":"^0.6.15",jest:"^29.7.0",lockblocks:"^1.1.8",prettier:"^3.2.5",react:"^18.2.0","react-dom":"^18.2.0","react-html-props":"^2.0.3","react-markdown":"^8.0.3","remark-gfm":"^3.0.1","replace-in-file":"^7.1.0",storybook:"^7.6.12","ts-jest":"^29.1.2",typescript:"^5.3.3",webpack:"^5.90.1"}};var c="LockBlocks",l=i.homepage,p="light",d=void 0,n=r({base:p,brandTitle:c,brandUrl:l,brandImage:d});s.setConfig({theme:n});})();
}catch(e){ console.error("[Storybook] One of your manager-entries failed: " + import.meta.url, e); }