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

function compose_email(recipient = '', subject = '', body = '') {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = recipient;
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = body;
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
      
      // Create email element
      console.log(email)
      const element = document.createElement("tr");
      element.className = "email";
      element.setAttribute("data-id", email.id);
      element.id = `email-${email.id}`;

      // Create Button Elements (READ and ARCHIVE)
      let buttonRead = document.createElement("button");
      buttonRead.className = "btn btn-sm btn-outline-secondary";
      buttonRead.id = `read-${email.id}`;
      let buttonArchive = document.createElement("button");
      buttonArchive.className = "btn btn-sm btn-outline-secondary";
      buttonArchive.id = `archive-${email.id}`;

      // Set background color based on read status
      if (email.read) {
        element.style.backgroundColor = 'lightgrey';
        buttonRead.innerHTML = "Mark as unread";
      } else {
        element.style.backgroundColor = 'white';
        buttonRead.innerHTML = "Mark as read";
      }

      // Set buttonArchive innerHTML based on Archive status
      if (email.archived) {
        buttonArchive.innerHTML = "Unarchive";
      } else {
        buttonArchive.innerHTML = "Archive";
      }

      // Select to or from depending on mailbox
      if (mailbox === 'sent') {
        senderOrRecipient = email.recipients;
        document.querySelector("#to-from").innerHTML = "To";
      } else {
        senderOrRecipient = email.sender;
        document.querySelector("#to-from").innerHTML = "From";
      }

      element.innerHTML = `<td>${senderOrRecipient}</td><td>${email.subject}</td><td>${email.timestamp}</td>` + '<td>' + buttonRead.outerHTML + '</td><td>' + buttonArchive.outerHTML + '</td>';
      document.querySelector('#emails').append(element);


      // Event listeners for display email
      element.addEventListener('click', () => {
        fetch(`/emails/${element.dataset.id}`)
        .then(response => response.json())
        .then(email => {
          console.log(email);
          display_email(email);
        })
      });

      // Event listener for toggle read
      document.querySelector(`#read-${email.id}`).addEventListener('click', (event) => {
        toggle_read(email.id);
        console.log("READ");
        event.stopPropagation();
      });

      // Event listener for toggle archive
      document.querySelector(`#archive-${email.id}`).addEventListener('click', (event) => {
        toggle_archive(email.id);
        event.stopPropagation();
      });
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

  const to= email.recipients;
  const from = email.sender;
  const subject = email.subject;
  const body = email.body;

  document.querySelector('#email-view').innerHTML = `
    <h3><strong>To:</strong>   ${to}</h3>
    <h3><strong>From:</strong>   ${from}</h3>
    <br>
    <h2><strong>Subject:</strong> ${subject}</h3>
    <br>
    <p>${body}</p>

    <button class="btn btn-sm btn-outline-secondary" id="reply">Reply</button>
  `;

  // New subject for reply email
  let replySubject;
  console.log(subject.slice(0, 3));
  if (subject.slice(0, 3) == "Re:") {
    replySubject = subject;
  } else {
    replySubject = `Re: ${subject}`;
  };

  // New Body for reply email
  let replyBody = `On ${email.timestamp} ${from} wrote: ${body}`;

  // Add event listener for reply button
  document.querySelector('#reply').addEventListener('click', () => {
    compose_email(from, replySubject, replyBody);
  });

  if (!email.read) {
    toggle_read(email.id);
  }

  return false;
}


function toggle_read(email_id) {

  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    if (email.read) {
      
      // Mark email as unread

      fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          read: false
        })
      })
      
    } else {
        
      // Mark email as read

      fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          read: true
        })
      })

    }
  })
  .then(() => {
    if (document.querySelector(`#email-${email_id}`).style.backgroundColor === 'lightgrey') {
      document.querySelector(`#email-${email_id}`).style.backgroundColor = 'white';
      document.querySelector(`#read-${email_id}`).innerHTML = "Mark as read";
    } else {
      document.querySelector(`#email-${email_id}`).style.backgroundColor = 'lightgrey';
      document.querySelector(`#read-${email_id}`).innerHTML = "Mark as unread";
    }
  })

}

function toggle_archive(email_id) {
  // Fetch email in question
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {

    // If email is archived currently
    if (email.archived) {
      
      // Unarchive email

      fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          archived: false
        })
      })
      .then(() => {
        load_mailbox('archive');
      })

      console.log(email);
      console.log("UNARCHIVED");
      
    // If email is not archived currently  
    } else {
        
      // Archive email

      fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          archived: true
        })
      })
      .then(() => {
        load_mailbox('inbox');
      })

      console.log(email);
      console.log("ARCHIVED");
    }
  })
  
}
