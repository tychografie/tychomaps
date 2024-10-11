document.addEventListener("DOMContentLoaded", async () => {
  const badRated = document.getElementById("badRated")
  const goodRated = document.getElementById("goodRated")
  const resultCountFilter = document.getElementById("resultCountFilter")

  const loadData = () =>
    loadFeedbackData(
      badRated.checked,
      goodRated.checked,
      resultCountFilter.value,
    )

  badRated.addEventListener("change", loadData)
  goodRated.addEventListener("change", loadData)
  resultCountFilter.addEventListener("change", loadData)

  await loadData()
})

async function authorize() {
  const password = prompt("Password:")
  try {
    const authResponse = await fetch(`/api/authorize`, {
      method: "POST",
      body: window.btoa(password),
    })
    if (!authResponse.ok) {
      console.error("Authorization failed")
      location.href = "/"
      return
    }
    const token = (await authResponse.json()).token
    localStorage.setItem("token", token)
  } catch (error) {
    console.error("Authorization error:", error)
    location.href = "/"
  }
}

async function loadFeedbackData(
  showBadRated,
  showGoodRated,
  resultCountFilter,
) {
  if (
    !localStorage.getItem("token") ||
    localStorage.getItem("token") === "undefined"
  ) {
    await authorize()
  }
  try {
    const queryParams = []

    if (showBadRated) queryParams.push("rating=-1")
    if (showGoodRated) queryParams.push("rating=1")

    if (resultCountFilter !== "any") {
      queryParams.push(`resultCountFilter=${resultCountFilter}`)
    }

    const queryString = queryParams.length ? `?${queryParams.join("&")}` : ""

    const response = await fetch(`/api/get-feedback${queryString}`, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    })

    const data = await response.json()
    document.querySelector("body").style.display = "block"
    renderFeedbackList(data)
  } catch (error) {
    localStorage.removeItem("token")
    await authorize()
  }
}

async function renderFeedbackList(data) {
  const feedbackList = document.getElementById("feedback-list")
  feedbackList.innerHTML = `
      <div class="flex items-center p-4 border-b border-gray-200 font-bold">
          <span class="w-1/12">Done?</span>
          <span class="w-2/12 min-w-0">When?</span>
          <span class="w-3/12 min-w-0">Query</span>
          <span class="w-full min-w-0">Maps Request</span>
          <span class="w-1/12 hidden md:flex min-w-0">Result Count</span>
      </div>
  `
  data.forEach((item) => {
    const row = document.createElement("div")
    row.className = "flex items-center p-4 border-b border-gray-200"

    const checkboxContainer = document.createElement("span")
    checkboxContainer.className = "w-1/12 flex justify-center"
    const checkbox = document.createElement("input")
    checkbox.type = "checkbox"
    checkbox.checked = item.feedbackHandled === 1
    checkbox.addEventListener("change", () =>
      handleCheckboxChange(item._id, checkbox.checked),
    )
    checkboxContainer.appendChild(checkbox)

    const queryText = document.createElement("span")
    queryText.className = "w-3/12 min-w-0 truncate"
    queryText.textContent = item.originalQuery // Change this line

    const mapsRequestText = document.createElement("span")
    mapsRequestText.className = "w-full min-w-0 truncate"
    mapsRequestText.textContent = item.mapsRequest

    const resultCountText = document.createElement("span")
    resultCountText.className = "w-1/12 min-w-0 truncate hidden md:flex"
    resultCountText.textContent = item.resultCount

    const timestampText = document.createElement("span")
    timestampText.className = "w-2/12 min-w-0 truncate"
    const date = dateFns.parseISO(item.timestamp)
    timestampText.textContent = dateFns.formatDistanceToNow(date, {
      addSuffix: true,
    })

    row.appendChild(checkboxContainer)
    row.appendChild(timestampText)
    row.appendChild(queryText)
    row.appendChild(mapsRequestText)
    row.appendChild(resultCountText)

    feedbackList.appendChild(row)
  })
}

async function handleCheckboxChange(id, isChecked) {
  await fetch("/api/get-feedback", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("token"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, feedbackHandled: isChecked }),
  })
}
