document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // Send email
  document.querySelector('#compose-form').onsubmit = () => {send_email();}

  // Open email

});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').firstElementChild.innerHTML = `${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}`;

  // Clear out emails
  document.querySelector('#emails').innerHTML = '';

  // Load the API and display emails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {
      console.log(email);
      const element = document.createElement("tr");
      element.className = "email";
      element.setAttribute("data-id", email.id);

      if (email.read) {
        element.style.backgroundColor = 'lightgrey';
      };
      element.innerHTML = `<td>${email.sender}</td><td>${email.subject}</td><td>${email.timestamp}</td>`;
      document.querySelector('#emails').append(element);

      element.addEventListener('click', () => {
        fetch(`/emails/${element.dataset.id}`)
        .then(response => response.json())
        .then(email => {
          console.log(email);
          display_email(email);
        })
      })
    })
  });
  
}

function send_email() {
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .then(result => {
    console.log(result);
    load_mailbox('sent');
  })
  .catch(error => {
    console.log('Error:', error);
  });

  return false;
}

function display_email(email) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  const from = email.sender;
  const subject = email.subject;
  const body = email.body;

  document.querySelector('#email-view').innerHTML = `
    <h3>From: ${from}</h3>
    <h3>Subject: ${subject}</h3>
    <p>${body}</p>
  `;

  mark_read(email.id);

  return false;
}

function mark_read(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })
  .then(response => response.json())
  .then(result => {
    console.log(result);
  })
  .catch(error => {
    console.log('Error:', error);
  });
}