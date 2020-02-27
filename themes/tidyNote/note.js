<% var postsByYears={}; %>
<% site.posts.sort('date', -1).forEach(function(post){ %>
    <% var year=post.date.year(); %>
    <% if (!postsByYears[year]) { %>
        <% postsByYears[year]=[]; %>
    <% } %>
    <% postsByYears[year].push(post); %>
<%});%>

<% var years=Object.getOwnPropertyNames(postsByYears); %>
<% years.forEach(function(year){ %>
    <div><%= year %></div>
    <% var posts=postsByYears[year]; %>
    <% if (posts.length) { %>
        <% <ul> %>
        <% posts.forEach(function(post){ %>
            <li><%= post.title %></li>
        <% }) %>
        </ul>
    <% } %>
<%});%>