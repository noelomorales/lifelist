<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bird Lifelist</title>
  <script defer src="app.js"></script>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-100 text-gray-900 p-4">
  <h1 class="text-2xl font-bold mb-4">Bird Lifelist</h1>

  <div class="mb-4">
    <input id="searchInput" type="text" placeholder="Search birds..." class="border p-2 w-full" autocomplete="off" />
    <ul id="autocompleteResults" class="bg-white border rounded shadow mt-1 hidden max-h-60 overflow-y-auto"></ul>
  </div>

  <form id="sightingForm" class="bg-white p-4 rounded shadow mb-6">
    <input id="birdName" type="text" placeholder="Bird Name" required class="border p-2 mb-2 w-full" />
    <input id="sciName" type="text" placeholder="Scientific Name" class="border p-2 mb-2 w-full" readonly />
    <input id="family" type="text" placeholder="Family" class="border p-2 mb-2 w-full" readonly />
    <input id="order" type="text" placeholder="Order" class="border p-2 mb-2 w-full" readonly />

    <select id="tier" class="border p-2 mb-2 w-full">
      <option value="wild">Wild</option>
      <option value="captive">Captive</option>
    </select>

    <input id="birdImage" type="file" accept="image/*" required class="mb-2" />
    <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded">Add Sighting</button>
  </form>

  <select id="filterTier" class="border p-2 mb-4 w-full sm:w-1/4">
    <option value="all">All</option>
    <option value="wild">Wild</option>
    <option value="captive">Captive</option>
  </select>

  <div id="sightingsList" class="space-y-4"></div>
</body>
</html>
