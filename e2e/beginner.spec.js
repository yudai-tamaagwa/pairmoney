import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /pairmoney（ペアマニ）を試してみよう/,
    }),
  ).toBeVisible();
});

test("初めての人がガイド付きテストを開始し、結果を記録できる", async ({
  page,
}) => {
  await page
    .getByRole("button", {
      name: "操作テストを始める",
    })
    .first()
    .click();
  await expect(
    page.getByRole("heading", {
      name: "はじめての操作テスト",
    }),
  ).toBeVisible();
  await expect(page.getByText("成功 0 / 7")).toBeVisible();
  await page
    .getByRole("combobox", {
      name: "ホームの数字を見るの結果",
    })
    .selectOption("passed");
  await expect(page.getByText("成功 1 / 7")).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("combobox", {
      name: "ホームの数字を見るの結果",
    }),
  ).toHaveValue("passed");
});

test("初心者が画面を切り替えてサンプルCSVを保存できる", async ({ page }) => {
  await page
    .getByRole("button", {
      name: "自由に触ってみる",
    })
    .click();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", {
      name: "サンプルCSV",
      exact: true,
    })
    .click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/\.csv$/);
  await page
    .getByRole("button", {
      name: /操作テストを始める/,
    })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "はじめての操作テスト",
    }),
  ).toBeVisible();
});

test("リロードしてもおためしデータとテスト結果を保持する", async ({ page }) => {
  await page
    .getByRole("button", {
      name: "操作テストを始める",
    })
    .first()
    .click();
  await page
    .getByRole("combobox", {
      name: "CSVを取り込むの結果",
    })
    .selectOption("failed");
  await page.reload();
  await expect(
    page.getByRole("combobox", {
      name: "CSVを取り込むの結果",
    }),
  ).toHaveValue("failed");
  await expect(page.getByText("問題あり 1")).toBeVisible();
});

test("次のテスターのために家計とテスト結果を一括リセットできる", async ({
  page,
}) => {
  await page
    .getByRole("button", {
      name: "操作テストを始める",
    })
    .first()
    .click();
  await page
    .getByRole("combobox", {
      name: "ホームの数字を見るの結果",
    })
    .selectOption("passed");
  await page
    .getByRole("textbox", {
      name: /気づいたこと・困ったこと/,
    })
    .fill("テスト用の感想");
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", {
      name: "家計データも含めてテストを最初から",
    })
    .click();
  await expect(page.getByText("成功 0 / 7")).toBeVisible();
  await expect(
    page.getByRole("combobox", {
      name: "ホームの数字を見るの結果",
    }),
  ).toHaveValue("");
  await expect(
    page.getByRole("textbox", {
      name: /気づいたこと・困ったこと/,
    }),
  ).toHaveValue("");
  await page.reload();
  await expect(page.getByText("成功 0 / 7")).toBeVisible();
});

test("問題のあった操作にメモを残して再読み込み後も保持できる", async ({
  page,
}) => {
  await page
    .getByRole("button", {
      name: "操作テストを始める",
    })
    .first()
    .click();
  await page
    .getByRole("combobox", {
      name: "CSVを取り込むの結果",
    })
    .selectOption("failed");
  await page
    .getByRole("textbox", {
      name: "CSVを取り込むのメモ",
    })
    .fill("CSVの列が分かりにくかった");
  await page.reload();
  await expect(
    page.getByRole("textbox", {
      name: "CSVを取り込むのメモ",
    }),
  ).toHaveValue("CSVの列が分かりにくかった");
});
