# 綠意小天地 Green Little World

以 Three.js 製作的繁體中文環保學習網頁，讓學生透過點擊與拖拉 3D 實物，認識花、樹、草，以及香港三色回收箱。介面採用大物件、大按鈕、簡短指示及正向回饋，讓學生按自己的步伐學習。

## 互動內容

- **花、樹、草**：點一下 3D 植物聽介紹，也可以按住拖動；另有「找一找」練習。
- **回收分類**：把 3D 回收物直接拖進回收箱，或先點物品拿起，再點回收箱。滑鼠與觸屏共用 Pointer Events 操作。
- **香港三色回收箱**：藍色收廢紙、黃色收金屬、啡色收塑膠。
- **六種回收物**：報紙、鋁罐、膠樽、紙盒、金屬罐、塑膠容器；可選基礎 3 件或進階 6 件。
- **學習支援**：中文語音優先選用粵語、加大文字、放大物件、減少動態、鍵盤及 HTML 按鈕替代操作。
- **安心練習**：答錯會回位並提供提示；沒有計時或扣分，答對後自行按「下一個」。

語音使用裝置提供的聲音；即使沒有語音或 WebGL，仍可使用文字、圖片及大按鈕完成學習。網頁不收集學生姓名或作答紀錄，只在瀏覽器的 localStorage 保存顯示與語音設定。

## 本機開啟

這是靜態網站，無須編譯、API 金鑰或後端。請用 HTTP 伺服器開啟，避免直接以 `file://` 載入 ES modules。

安裝 Python 3 後，在專案目錄執行：

```sh
python3 -m http.server 8000 --directory dist
```

然後開啟 <http://localhost:8000>。Windows 也可使用 `py -m http.server 8000 --directory dist`。

所有執行所需檔案均位於 `dist/`，可交由任何支援靜態網頁的主機服務提供。

## 檔案

```text
dist/
  index.html                 網頁結構
  styles.css                 響應式與無障礙樣式
  app.js                     教學流程、回饋與語音
  scene.js                   Three.js 模型、點選與拖拉
  vendor/
    three.module.js          Three.js 0.169.0
    THREE-LICENSE.txt        Three.js MIT 授權
tests/
  scene-interaction.test.mjs 3D 幾何及指標互動檢查
```

## 檢查

使用 Node.js 22 或更新版本執行：

```sh
npm test
```

測試使用真正的 Three.js 幾何及 raycasting，搭配模擬 renderer／pointer events，檢查三種畫面尺寸、物件大小、拖放、取消操作、鎖定、動畫及資源釋放。這些檢查不會啟動瀏覽器，仍建議在實際使用的平板、觸屏或電腦上試用。

## 第三方程式庫

Three.js 0.169.0 已包含在專案內，依 MIT 授權使用；詳見 [`dist/vendor/THREE-LICENSE.txt`](dist/vendor/THREE-LICENSE.txt)。
