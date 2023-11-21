# clg-header-vue3

## Usage 
```html

<head>
    <meta charset="utf-8" />
    <title>Demo Menu and Submenu</title>
</head>

<body style="background:#ccc">
    <ul id="main-menu" 
        tag-parent-sub-menu="li" 
        data-id="main-menu"
        data-is-guest="true">
        <li v-for="(key, index) in Object.keys(menus)">
            <menu-item class-name="nav" 
                        :is-guest="isGuest" href="#" 
                        :has-sub-menu="menus[key].length > 0"
                        :name="menus[key][0].GameType" 
                        :key="key">

                <image-item class-name="mm" 
                            :image-data="menus[key][0]" :cache-version="cacheVersion" 
                            :key="index">
                </image-item>

                {{menus[key][0].GameMenuDisplayName}}

                <down-arrow type="text" :key="key"></down-arrow>

                <submenu-container :name="menus[key][0].GameType">
                    <submenu-item v-for="(record, index) in menus[key]" 
                        :type="record.GameType" 
                        :is-guest="isGuest"
                        :name="record.GameName"
                        :key="index">
                        <image-item :image-data="record" 
                                    is-submenu="true" 
                                    :cache-version="cacheVersion" 
                                    :key="index" />
                    </submenu-item>
                </submenu-container>
            </menu-item>
        </li>
    </ul>
    <script src="js/jquery-1.7.1.min.js"></script>
    <script src="js/vue3.3.7.global.js"></script>
    <script>const mountEl = document.querySelector("#main-menu");</script>
    <script src="js/header.menu.vue.js?v=1700386816169"></script>
    <script>menu.mount("#main-menu");</script>
</body>
</html>


```
